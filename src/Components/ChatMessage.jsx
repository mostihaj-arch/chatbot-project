import { lazy, Suspense, useState } from "react";
import RobotProfileImage from "../assets/robot.png";
import UserProfileImage from "../assets/user.png";
import "./ChatMessage.css";

const MarkdownMessage = lazy(() => import("./MarkdownMessage"));

function ChatMessage({ message, sender }) {
  const [copyStatus, setCopyStatus] = useState("");
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("Copied!");
    } catch (error) {
      console.error("Failed to copy message:", error);
      setCopyStatus("Couldn't copy. Please select and copy the text manually.");
    }
  }
  return (
    <div
      className={sender === "user" ? "chat-message-user" : "chat-message-robot"}
    >
      {sender === "robot" && (
        <img
          src={RobotProfileImage}
          alt="Chatbot"
          className="chat-message-profile"
        />
      )}

      <div className="chat-message-text">
        {sender === "robot" ? (
          <Suspense fallback={<div className="message-plain">{message}</div>}>
            <MarkdownMessage message={message} />
          </Suspense>
        ) : (
          <div className="message-plain">{message}</div>
        )}

        {sender === "robot" && (
          <div className="message-actions">
            <button type="button" className="copy-button" onClick={copyMessage}>
              Copy
            </button>

            <span className="copy-status" role="status" aria-live="polite">
              {copyStatus}
            </span>
          </div>
        )}
      </div>

      {sender === "user" && (
        <img
          src={UserProfileImage}
          alt="You"
          className="chat-message-profile"
        />
      )}
    </div>
  );
}

export default ChatMessage;
