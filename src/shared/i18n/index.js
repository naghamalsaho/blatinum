import en from "./en.json";
import ar from "./ar.json";

const LOCALE_KEY = "lang";

export const getLanguage = () => localStorage.getItem(LOCALE_KEY) || "ar";

export const getDirection = (lang = getLanguage()) => (lang === "en" ? "ltr" : "rtl");

export const setLanguage = (lang) => {
  localStorage.setItem(LOCALE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = getDirection(lang);
};

const DICTS = { en, ar };

export const t = (key, variables = {}) => {
  const lang = getLanguage();
  const value = DICTS[lang]?.[key] ?? DICTS.en?.[key] ?? key;

  return Object.entries(variables).reduce(
    (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
    value
  );
};

export default { getDirection, getLanguage, setLanguage, t };
