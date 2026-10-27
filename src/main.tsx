import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { setupMobileSafeguards } from "./mobile-guards";

// Initialize mobile and browser gesture/zoom safeguards
setupMobileSafeguards();

// Caché persistente de imágenes y assets (solo en producción, para no interferir con el modo desarrollo)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("Service Worker no registrado:", err));
  });
}

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
