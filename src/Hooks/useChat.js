import { useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";

export function useChat({ chatMessages, setChatMessages, setIsLoading }) {
  const [error, setError] = useState("");
  const [failedMessage, setFailedMessage] = useState(null);

  const requestRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    return () => {
      const controller = requestRef.current;
      requestRef.current = null;
      controller?.abort();
    };
  }, []);

  async function requestResponse(messages) {
    const controller = new AbortController();
    requestRef.current = controller;

    const responseId = crypto.randomUUID();
    let reader = null;
    let fullText = "";
    let receivedDone = false;

    sendingRef.current = true;
    setIsLoading(true);
    setError("");
    setFailedMessage(null);

    function processLine(line) {
      if (!line.trim()) {
        return;
      }

      if (receivedDone) {
        throw new Error("Received data after the response finished.");
      }

      const record = JSON.parse(line);

      if (record.type === "error") {
        throw new Error(record.message || "The response was interrupted.");
      }

      if (record.type === "done") {
        receivedDone = true;
        return;
      }

      if (record.type !== "delta" || typeof record.text !== "string") {
        throw new Error("Invalid streaming response.");
      }

      fullText += record.text;

      const updatedMessage = {
        id: responseId,
        sender: "robot",
        message: fullText,
      };

      setChatMessages((previousMessages) => {
        const messageExists = previousMessages.some(
          (item) => item.id === responseId,
        );

        if (!messageExists) {
          return [...previousMessages, updatedMessage];
        }

        return previousMessages.map((item) =>
          item.id === responseId ? updatedMessage : item,
        );
      });
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please log in again.");
      }

      if (requestRef.current !== controller) {
        return;
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          stream: true,
          messages: messages.map((item) => ({
            role: item.sender === "user" ? "user" : "assistant",
            content: item.message,
          })),
        }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new Error(
          "Your session could not be verified. Please log in again.",
        );
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Streaming is unavailable.");
      }

      reader = response.body.getReader();

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (requestRef.current !== controller) {
          return;
        }

        buffer += done
          ? decoder.decode()
          : decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");

        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          processLine(line);

          newlineIndex = buffer.indexOf("\n");
        }

        if (done) {
          if (buffer.trim()) {
            processLine(buffer);
          }

          break;
        }
      }

      if (!receivedDone) {
        throw new Error("The connection ended before the response finished.");
      }

      if (!fullText.trim()) {
        throw new Error("The AI returned no text.");
      }
    } catch (error) {
      if (controller.signal.aborted || requestRef.current !== controller) {
        return;
      }

      console.error("Failed to get response:", error);
      setError(
        error.message === "Please log in again." ||
          error.message ===
            "Your session could not be verified. Please log in again."
          ? error.message
          : "Couldn't finish the response. Please try again.",
      );

      setFailedMessage({
        messages,
        responseId,
      });
    } finally {
      controller.abort();
      reader?.releaseLock();

      if (requestRef.current === controller) {
        requestRef.current = null;
        sendingRef.current = false;
        setIsLoading(false);
      }
    }
  }

  function sendMessage(text) {
    const message = text.trim();

    if (!message || sendingRef.current) {
      return false;
    }

    const userMessage = {
      message,
      sender: "user",
      id: crypto.randomUUID(),
    };

    const messagesForRequest = [...chatMessages, userMessage];

    setChatMessages((previousMessages) => [...previousMessages, userMessage]);

    requestResponse(messagesForRequest);
    return true;
  }

  function stopResponse() {
    const controller = requestRef.current;

    requestRef.current = null;
    controller?.abort();

    sendingRef.current = false;
    setIsLoading(false);
  }

  function retryResponse() {
    if (failedMessage === null || sendingRef.current) {
      return;
    }

    const { messages, responseId } = failedMessage;

    setChatMessages((previousMessages) =>
      previousMessages.filter((item) => item.id !== responseId),
    );

    requestResponse(messages);
  }
  return {
    error,
    failedMessage,
    sendMessage,
    stopResponse,
    retryResponse,
  };
}
