export function createConversation(messages = []) {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages,
  };
}