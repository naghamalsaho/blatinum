import en from "./en.json";
import ar from "./ar.json";

const LOCALE_KEY = "lang";

export const getLanguage = () => localStorage.getItem(LOCALE_KEY) || "ar";

export const setLanguage = (lang) => {
  localStorage.setItem(LOCALE_KEY, lang);
};

const DICTS = { en, ar };

export const t = (key) => {
  const lang = getLanguage();
  const dict = DICTS[lang] || DICTS.ar;

  // يدعم الوصول للمفاتيح المتداخلة مثل legal_contracts.title
  const value = key.split(".").reduce((obj, k) => obj?.[k], dict);

  return value ?? key;
};

export default { getLanguage, setLanguage, t };