import "./input.css";  // Tailwind
import "./index.css";  // Your overrides

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeSettings } from "./lib/storage/settingsStorage";

// Initialize settings (e.g., reduced motion preference)
initializeSettings();

const container = document.getElementById("app");

if (!container) {
  throw new Error("Failed to find app root element");
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
