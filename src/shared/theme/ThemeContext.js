import { createContext } from "react";

export const ThemeContext = createContext(null);
export const STORAGE_KEY = "app-theme";

export function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
