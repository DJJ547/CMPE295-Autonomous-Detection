import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "semantic-ui-css/semantic.min.css";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
