import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { MuiThemeProvider } from "./components/MuiThemeProvider";
import "./index.css";

document.documentElement.classList.add("dark");
try {
  localStorage.setItem("theme", "dark");
} catch (e) {
  /* ignore */
}

createRoot(document.getElementById("root")!).render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>,
);
