import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store/store";

import "./index.css";
import "./shared/constants/colors.css";
import App from "./App.jsx";
import { ThemeProvider } from "./shared/theme/ThemeProvider";

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