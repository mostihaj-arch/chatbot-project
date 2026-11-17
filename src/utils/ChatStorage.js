const STORAGE_KEY = "chatbot-messages";

export function loadMessages() {
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEY);

    if (!savedMessages) {
      return [];
    }

    const parsedMessages = JSON.parse(savedMessages);

    if (!Array.isArray(parsedMessages)) {
      return [];
    }

    return parsedMessages.filter(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.message === "string" &&
        (item.sender === "user" || item.sender === "robot")
    );
  } catch (error) {
    console.error("Failed to load messages:", error);
    return [];
  }
}


export function saveMessages(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save messages:", error);
  }
}
