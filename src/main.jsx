import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
