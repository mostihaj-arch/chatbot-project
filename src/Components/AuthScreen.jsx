import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useTheme } from "../Hooks/useTheme";
import App from "../App";
import "./AuthScreen.css";

function AuthScreen() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const credentials = {
        email: email.trim(),
        password,
      };

      const { data, error } = isSignUp
        ? await supabase.auth.signUp(credentials)
        : await supabase.auth.signInWithPassword(credentials);

      if (error) throw error;

      setPassword("");

      if (!data.session) {
        setNotice(
          "Check your email for a confirmation link, then return and log in.",
        );
      }
    } catch (error) {
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setPassword("");
      setNotice("");
    } catch (error) {
      setError(error.message || "Couldn't log out.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode() {
    setIsSignUp((previous) => !previous);
    setPassword("");
    setError("");
    setNotice("");
    setShowPassword(false);
  }

  if (isCheckingSession) {
    return (
      <main className="auth-screen">
        <p role="status">Checking your session...</p>
      </main>
    );
  }

  return (
    <div className={user ? "signed-in-layout" : "auth-screen"}>
      {!user && <h1>Chatbot</h1>}

      {!user && (
        <button
          type="button"
          className="theme-toggle auth-theme-toggle"
          aria-pressed={theme === "dark"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      )}

      {error && (
        <p className="auth-feedback auth-feedback-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="auth-feedback auth-feedback-notice" role="status">
          {notice}
        </p>
      )}

      {user ? (
        <App
          key={user.id}
          user={user}
          onSignOut={handleSignOut}
          isSigningOut={isSubmitting}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <>
          <h2>{isSignUp ? "Create an account" : "Log in"}</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />

            <label htmlFor="auth-password">Password</label>
            <div className="password-field">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                minLength={8}
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls="auth-password"
                onClick={() => setShowPassword((previous) => !previous)}
                disabled={isSubmitting}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              className="chat-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait..."
                : isSignUp
                  ? "Sign up"
                  : "Log in"}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch"
            onClick={switchMode}
            disabled={isSubmitting}
          >
            {isSignUp
              ? "Already have an account? Log in"
              : "Need an account? Sign up"}
          </button>
        </>
      )}
    </div>
  );
}

export default AuthScreen;
