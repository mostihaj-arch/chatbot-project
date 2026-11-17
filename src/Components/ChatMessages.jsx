import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import RobotProfileImage from "../assets/robot.png";
import LoadingSpinnerImage from "../assets/loading-spinner.gif";
import "./ChatMessages.css";

function ChatMessages({ chatMessages, isLoading }) {
  const chatMessagesRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  function handleScroll() {
    const container = chatMessagesRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 80;
  }

  useEffect(() => {
    const container = chatMessagesRef.current;

    if (container && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatMessages, isLoading]);
  const lastMessage = chatMessages[chatMessages.length - 1];

  const isWaitingForResponse = isLoading && lastMessage?.sender !== "robot";
  return (
    <div
      className="chat-messages-container"
      ref={chatMessagesRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Conversation"
      aria-live="polite"
      aria-relevant="additions"
    >
      {chatMessages.length === 0 && (
        <p className="welcome-message">
          Welcome to the chatbot project! Send a message using the textbox
          below.
        </p>
      )}
      {chatMessages.map((chatMessage) => {
        return (
          <ChatMessage
            message={chatMessage.message}
            sender={chatMessage.sender}
            key={chatMessage.id}
          />
        );
      })}
      {isWaitingForResponse && (
        <div className="chat-message-robot">
          <img
            src={RobotProfileImage}
            alt=""
            className="chat-message-profile"
          />
          <div className="chat-message-text">
            <img src={LoadingSpinnerImage} alt="" className="loading-spinner" />
          </div>
          <span className="visually-hidden">Chatbot is responding</span>
        </div>
      )}
    </div>
  );
}

export default ChatMessages;
