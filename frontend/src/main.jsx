import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ReloadPrompt from "./components/ReloadPrompt.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
      <ReloadPrompt />
    </LanguageProvider>
  </React.StrictMode>
);