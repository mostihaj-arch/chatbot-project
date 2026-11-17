import { useState } from "react";
import "./ConversationSidebar.css";

function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading,
  userEmail,
  onSignOut,
  isSignOutDisabled,
  theme,
  onToggleTheme,
  onDeleteConversation,
  isDeleteDisabled,
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <aside className={`conversation-sidebar${isOpen ? " is-open" : ""}`}>
      <div className="sidebar-heading">
        <h2>Conversations</h2>

        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={isOpen}
          aria-controls="sidebar-content"
          onClick={() => setIsOpen((previous) => !previous)}
        >
          {isOpen ? "Hide chats" : "Show chats"}
        </button>
      </div>
      <div id="sidebar-content" className="sidebar-content">
        <button
          type="button"
          className="chat-button"
          onClick={onNewConversation}
          disabled={isLoading}
        >
          New chat
        </button>

        <nav aria-label="Conversations">
          <ul className="conversation-list">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="conversation-row">
                <button
                  type="button"
                  className={
                    conversation.id === activeConversationId
                      ? "conversation-button active"
                      : "conversation-button"
                  }
                  aria-current={
                    conversation.id === activeConversationId
                      ? "true"
                      : undefined
                  }
                  onClick={() => onSelectConversation(conversation.id)}
                  disabled={isLoading}
                >
                  {conversation.title}
                </button>
                <button
                  type="button"
                  className="conversation-delete"
                  onClick={() => onDeleteConversation(conversation.id)}
                  disabled={isDeleteDisabled}
                  aria-label={`Delete chat: ${conversation.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <footer className="sidebar-account">
          <div>
            <p className="sidebar-account-label">Signed in as</p>
            <p className="sidebar-account-email">{userEmail}</p>
          </div>

          <button
            type="button"
            className="theme-toggle"
            aria-pressed={theme === "dark"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <button
            type="button"
            className="sidebar-signout"
            onClick={onSignOut}
            disabled={isSignOutDisabled}
          >
            Log out
          </button>
        </footer>
      </div>
    </aside>
  );
}

export default ConversationSidebar;
