import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

console.log("Clerk Key:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY); // Debugging
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL); // Debugging

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
