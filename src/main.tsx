import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/native.css";
import "./lib/i18n";
import { initSentry } from "./lib/sentry";
import { initNative, isNative, platform } from "./native/capacitor";

// Tag <html> so Tailwind/CSS can scope mobile-only styles (e.g. safe areas).
document.documentElement.dataset.platform = platform;
if (isNative) document.documentElement.classList.add("is-native");

initSentry();

// Fire native init in parallel with React mounting.
initNative().catch((err) => console.warn("[circlo] native init failed", err));

createRoot(document.getElementById("root")!).render(<App />);
