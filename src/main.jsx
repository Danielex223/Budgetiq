import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Global reset — fixes inputs/buttons overflowing their cards
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; }
  input, select, button, textarea { box-sizing: border-box; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);