import { useRef } from "react";
import { useChat } from "../Hooks/useChat";
import "./ChatInput.css";

const suggestedPrompts = [
  "Hello",
  "What is today's date?",
  "Flip a coin",
  "Roll a dice",
];

function ChatInput({
  chatMessages,
  setChatMessages,
  isLoading,
  setIsLoading,
  isConversationEmpty,
  inputText,
  onInputTextChange,
}) {
  const inputRef = useRef(null);

  const { error, failedMessage, sendMessage, stopResponse, retryResponse } =
    useChat({
      chatMessages,
      setChatMessages,
      setIsLoading,
    });

  function handleInputKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();

      if (!event.repeat) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }
  function selectPrompt(prompt) {
    onInputTextChange(prompt);
    inputRef.current?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const accepted = sendMessage(inputText);

    if (accepted) {
      onInputTextChange("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chat-input-section">
      {isConversationEmpty && (
        <div
          className="suggested-prompts"
          role="group"
          aria-label="Suggested messages"
        >
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="suggested-prompt"
              onClick={() => selectPrompt(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div className="chat-input-error">
          <p role="alert">{error}</p>

          {failedMessage !== null && (
            <button
              type="button"
              className="chat-button"
              onClick={retryResponse}
              disabled={isLoading}
            >
              Retry
            </button>
          )}
        </div>
      )}

      <form className="text-box-container" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          aria-label="Message to chatbot"
          placeholder="Send a message to Chatbot"
          value={inputText}
          onChange={(event) => onInputTextChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          className="text-box"
          rows={2}
        />

        {isLoading ? (
          <button
            key="stop"
            type="button"
            className="chat-button send-button"
            onClick={stopResponse}
          >
            Stop
          </button>
        ) : (
          <button
            key="send"
            type="submit"
            className="chat-button send-button"
            disabled={inputText.trim() === ""}
          >
            Send
          </button>
        )}
      </form>
      <p className="input-hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}

export default ChatInput;
