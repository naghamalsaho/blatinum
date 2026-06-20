import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store/store";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./shared/constants/colors.css";
import App from "./App.jsx";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { getLanguage } from "./shared/i18n";

const language = getLanguage();
document.documentElement.lang = language;
document.documentElement.dir = language === "en" ? "ltr" : "rtl";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <StrictMode>
            <App />
          </StrictMode>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
} else {
  console.error("Root element not found");
}