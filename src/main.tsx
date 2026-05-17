import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/experimental-glass.css";

// Activate experimental glass theme layer (toggle by removing this class)
document.documentElement.classList.add("theme-exp");
document.body.classList.add("theme-exp");

createRoot(document.getElementById("root")!).render(<App />);
