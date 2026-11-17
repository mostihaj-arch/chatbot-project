import { createConversation } from "./createConversation";
import { loadMessages } from "./ChatStorage";

const STORAGE_KEY = "chatbot-conversations";
const ACTIVE_CONVERSATION_KEY = "chatbot-active-conversation";

function isValidMessage(message) {
  return (
    message !== null &&
    typeof message === "object" &&
    typeof message.id === "string" &&
    typeof message.message === "string" &&
    (message.sender === "user" || message.sender === "robot")
  );
}

function isValidConversation(conversation) {
  return (
    conversation !== null &&
    typeof conversation === "object" &&
    typeof conversation.id === "string" &&
    typeof conversation.title === "string" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isValidMessage)
  );
}

export function loadConversations() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData !== null) {
      const parsedData = JSON.parse(savedData);

      if (
        Array.isArray(parsedData) &&
        parsedData.length > 0 &&
        parsedData.every(isValidConversation)
      ) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Failed to load conversations:", error);
  }

  const messages = loadMessages();
  const conversation = createConversation(messages);

  const firstUserMessage = messages.find(
    (message) => message.sender === "user"
  );

  if (firstUserMessage) {
    conversation.title = firstUserMessage.message.slice(0, 35);
  }

  return [conversation];
}

export function saveConversations(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Failed to save conversations:", error);
  }
}

export function loadActiveConversationId() {
  try {
    return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
  } catch (error) {
    console.error("Failed to load selected conversation:", error);
    return null;
  }
}

export function saveActiveConversationId(conversationId) {
  try {
    localStorage.setItem(
      ACTIVE_CONVERSATION_KEY,
      conversationId
    );
  } catch (error) {
    console.error("Failed to save selected conversation:", error);
  }
}
