import { useState, useEffect, useRef } from "react";
import ChatInput from "./Components/ChatInput";
import ChatMessages from "./Components/ChatMessages";
import ConversationSidebar from "./Components/ConversationSidebar";
import {
  loadUserConversations,
  saveUserConversations,
  deleteUserConversation,
} from "./utils/conversationDatabase";
import { createConversation } from "./utils/createConversation";
import "./App.css";

function App({ user, onSignOut, isSigningOut, theme, onToggleTheme }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [conversationError, setConversationError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState({});

  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveAttempt, setSaveAttempt] = useState(0);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let ignore = false;

    async function loadHistory() {
      setIsLoadingConversations(true);
      setConversationError("");

      try {
        const savedConversations = await loadUserConversations(user.id);

        if (ignore) return;

        const initialConversations =
          savedConversations.length > 0
            ? savedConversations
            : [createConversation()];

        setConversations(initialConversations);
        setActiveConversationId(initialConversations[0].id);
      } catch (error) {
        if (ignore) return;

        console.error("Failed to load conversations:", error);
        setConversationError(
          "Couldn't load your conversations. Please refresh to try again.",
        );
      } finally {
        if (!ignore) {
          setIsLoadingConversations(false);
        }
      }
    }

    loadHistory();

    return () => {
      ignore = true;
    };
  }, [user.id]);

  useEffect(() => {
    if (
      isLoadingConversations ||
      conversationError ||
      conversations.length === 0 ||
      isDeleting
    ) {
      return;
    }

    if (isLoading) {
      setSaveStatus("pending");
      return;
    }

    let ignore = false;

    setSaveStatus("saving");

    const timer = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current
        .then(async () => {
          if (ignore) return;

          await saveUserConversations(user.id, conversations);

          if (!ignore) {
            setSaveStatus("saved");
          }
        })
        .catch((error) => {
          console.error("Failed to save conversations:", error);

          if (!ignore) {
            setSaveStatus("error");
          }
        });
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    conversations,
    user.id,
    isLoading,
    isLoadingConversations,
    conversationError,
    saveAttempt,
    isDeleting,
  ]);

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? conversations[0];

  const chatMessages = activeConversation?.messages ?? [];

  const activeDraft = activeConversation
    ? (drafts[activeConversation.id] ?? "")
    : "";

  function updateActiveDraft(text) {
    const conversationId = activeConversation.id;

    setDrafts((previousDrafts) => ({
      ...previousDrafts,
      [conversationId]: text,
    }));
  }

  function setChatMessages(nextMessages) {
    const conversationId = activeConversation.id;

    setConversations((previousConversations) =>
      previousConversations.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        const updatedMessages =
          typeof nextMessages === "function"
            ? nextMessages(conversation.messages)
            : nextMessages;
        const firstUserMessage = updatedMessages.find(
          (message) => message.sender === "user",
        );

        return {
          ...conversation,
          title: firstUserMessage
            ? firstUserMessage.message.slice(0, 35)
            : "New chat",
          messages: updatedMessages,
        };
      }),
    );
  }
  function startNewConversation() {
    const newConversation = createConversation();

    setConversations((previousConversations) => [
      ...previousConversations,
      newConversation,
    ]);

    setActiveConversationId(newConversation.id);
  }
  function clearConversation() {
    setChatMessages([]);
  }
  function selectConversation(conversationId) {
    if (isLoading) {
      return;
    }

    setActiveConversationId(conversationId);
  }

  if (isLoadingConversations) {
    return <p role="status">Loading your conversations...</p>;
  }

  if (conversationError) {
    return <p role="alert">{conversationError}</p>;
  }

  if (!activeConversation) {
    return <p role="alert">No conversation is available.</p>;
  }

  async function deleteConversation(conversationId) {
    if (isLoading || isDeleting || saveStatus !== "saved") {
      return;
    }

    const conversation = conversations.find(
      (item) => item.id === conversationId,
    );

    if (!conversation) return;

    const confirmed = window.confirm(
      `Delete "${conversation.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const deletion = saveQueueRef.current.then(() =>
        deleteUserConversation(user.id, conversationId),
      );

      saveQueueRef.current = deletion.catch(() => {});

      await deletion;

      const remaining = conversations.filter(
        (item) => item.id !== conversationId,
      );

      const nextConversations =
        remaining.length > 0 ? remaining : [createConversation()];

      setConversations(nextConversations);

      if (activeConversationId === conversationId) {
        setActiveConversationId(nextConversations[0].id);
      }

      setDrafts((previousDrafts) => {
        const nextDrafts = { ...previousDrafts };
        delete nextDrafts[conversationId];
        return nextDrafts;
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setDeleteError("Couldn't delete the chat. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="chat-layout">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation.id}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
        isLoading={isLoading || isDeleting}
        userEmail={user.email}
        onSignOut={onSignOut}
        isSignOutDisabled={
          isSigningOut ||
          isLoading ||
          isDeleting ||
          saveStatus === "pending" ||
          saveStatus === "saving"
        }
        theme={theme}
        onToggleTheme={onToggleTheme}
        onDeleteConversation={deleteConversation}
        isDeleteDisabled={isLoading || isDeleting || saveStatus !== "saved"}
      />

      <main className="App-container">
        <header className="chat-header">
          <h1>Chatbot</h1>

          <button
            type="button"
            className="chat-button"
            onClick={clearConversation}
            disabled={isLoading || isDeleting || chatMessages.length === 0}
          >
            Clear conversation
          </button>
        </header>
        <div className="save-status" role="status">
          {saveStatus === "pending" &&
            "Response in progress — changes not saved yet."}
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}

          {saveStatus === "error" && (
            <>
              <span>Couldn't save your conversations.</span>

              <button
                type="button"
                onClick={() => setSaveAttempt((previous) => previous + 1)}
              >
                Retry save
              </button>
            </>
          )}
        </div>

        {isDeleting && <p role="status">Deleting chat...</p>}

        {deleteError && <p role="alert">{deleteError}</p>}

        <ChatMessages chatMessages={chatMessages} isLoading={isLoading} />

        <fieldset disabled={isDeleting} className="chat-input-controls">
          <ChatInput
            key={activeConversation.id}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isConversationEmpty={chatMessages.length === 0}
            inputText={activeDraft}
            onInputTextChange={updateActiveDraft}
          />
        </fieldset>
      </main>
    </div>
  );
}

export default App;
