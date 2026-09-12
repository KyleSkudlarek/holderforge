import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

const container = document.getElementById("root");
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Catalog pages ship prerendered (scripts/prerender.mjs stamps data-route on
// the root). Hydrate when the markup is for this URL; otherwise the SPA
// fallback served another page's HTML, so render from scratch.
const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
if (container.hasChildNodes() && container.dataset.route === currentPath) {
  hydrateRoot(container, app);
} else {
  container.replaceChildren();
  createRoot(container).render(app);
}
