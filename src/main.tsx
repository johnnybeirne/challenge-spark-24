import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";

if (
  typeof window !== "undefined" &&
  window.location.hostname === "leadio.johnnybeirne.com"
) {
  const target = `https://leadtree.johnnybeirne.com${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
}

createRoot(document.getElementById("root")!).render(<App />);

