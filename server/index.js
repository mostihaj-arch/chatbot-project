import express from "express";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(serverDirectory, "../dist");

const groq = new Groq();
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend is running",
  });
});

async function requireAuth(req, res, next) {
  const authorization = req.get("Authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Please log in to use the chatbot.",
    });
  }

  try {
    const token = match[1];

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Your session could not be verified. Please log in again.",
      });
    }

    req.user = user;
  } catch (error) {
    console.error("Authentication check failed:", error.message);

    return res.status(503).json({
      error: "Couldn't verify your session. Please try again.",
    });
  }

  if (res.destroyed) return;

  next();
}

app.post("/api/chat", requireAuth, async (req, res) => {
  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: "Please provide a non-empty messages array.",
    });
  }

  const validMessages = messages.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      item.content.trim() !== "",
  );

  if (!validMessages || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({
      error:
        "Messages must contain valid roles and text, ending with a user message.",
    });
  }

  const conversationMessages = messages.map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const controller = new AbortController();

  function handleDisconnect() {
    if (!res.writableEnded) {
      controller.abort();
    }
  }

  res.on("close", handleDisconnect);

  try {
    if (req.body.stream === true) {
      const stream = await groq.chat.completions.create(
        {
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful chatbot. Give clear, concise answers.",
            },
            ...conversationMessages,
          ],
          max_completion_tokens: 1024,
          stream: true,
        },
        {
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted || res.destroyed) {
        return;
      }

      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.flushHeaders();

      let receivedText = false;

      for await (const chunk of stream) {
        if (controller.signal.aborted || res.destroyed) {
          return;
        }

        const text = chunk.choices[0]?.delta?.content;

        if (typeof text === "string" && text.length > 0) {
          receivedText = true;

          res.write(
            JSON.stringify({
              type: "delta",
              text,
            }) + "\n",
          );
        }
      }

      if (controller.signal.aborted || res.destroyed) {
        return;
      }

      if (!receivedText) {
        throw new Error("The AI returned no text.");
      }

      res.write(JSON.stringify({ type: "done" }) + "\n");
      res.end();
      return;
    }
    const completion = await groq.chat.completions.create(
      {
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are a helpful chatbot. Give clear, concise answers.",
          },
          ...conversationMessages,
        ],
        max_completion_tokens: 1024,
      },
      {
        signal: controller.signal,
      },
    );
    if (controller.signal.aborted || res.destroyed) {
      return;
    }

    const reply = completion.choices[0]?.message?.content;

    if (!reply?.trim()) {
      return res.status(502).json({
        error: "The AI returned no text. Please try again.",
      });
    }

    res.json({
      message: reply,
    });
  } catch (error) {
    if (controller.signal.aborted || res.destroyed) {
      console.log("Chat request canceled.");
      return;
    }

    console.error("Groq request failed:", error.status, error.message);

    if (res.headersSent) {
      res.end(
        JSON.stringify({
          type: "error",
          message: "The response was interrupted. Please try again.",
        }) + "\n",
      );
    } else {
      res.status(502).json({
        error: "Couldn't get an AI response. Please try again.",
      });
    }
  } finally {
    res.off("close", handleDisconnect);
  }
});

app.use(express.static(frontendDirectory));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
