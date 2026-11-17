import { supabase } from "./supabaseClient";

export async function loadUserConversations(userId) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, messages")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function saveUserConversations(userId, conversations) {
  if (conversations.length === 0) return;

  const rows = conversations.map((conversation) => ({
    id: conversation.id,
    user_id: userId,
    title: conversation.title,
    messages: conversation.messages,
  }));

  const { error } = await supabase
    .from("conversations")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw error;
  }
}

export async function deleteUserConversation(userId, conversationId) {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
