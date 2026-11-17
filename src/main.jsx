import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AuthScreen from "./Components/AuthScreen";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthScreen />
  </StrictMode>,
);
