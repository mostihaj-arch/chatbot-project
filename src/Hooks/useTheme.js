import { useEffect, useState } from "react";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem("chatbot-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Use the device preference if storage is unavailable.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("chatbot-theme", theme);
    } catch {
      // The theme still works without persistence.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  }

  return { theme, toggleTheme };
}
