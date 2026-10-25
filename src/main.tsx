import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { setupMobileSafeguards } from "./mobile-guards";

// Initialize mobile and browser gesture/zoom safeguards
setupMobileSafeguards();

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
