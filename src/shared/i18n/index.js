import en from "./en.json";
import ar from "./ar.json";

const LOCALE_KEY = "lang";

export const getLanguage = () =>
  localStorage.getItem(LOCALE_KEY) || "ar";

export const getDirection = (lang = getLanguage()) =>
  lang === "en" ? "ltr" : "rtl";

export const setLanguage = (lang) => {
  localStorage.setItem(LOCALE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = getDirection(lang);
  
  // إرسال حدث عام لتحديث كافة مكونات واجهة المستخدم
  window.dispatchEvent(new Event("languageChange"));
};

const DICTS = { en, ar };

export const t = (key, variables = {}) => {
  const lang = getLanguage();
  const dict = DICTS[lang] || DICTS.ar;

  let value = key.split(".").reduce((obj, k) => obj?.[k], dict);

  if (value == null) {
    value = key.split(".").reduce((obj, k) => obj?.[k], DICTS.en);
  }

  if (value == null) {
    value = key;
  }

  return Object.entries(variables).reduce(
    (text, [name, replacement]) =>
      String(text).replaceAll(`{${name}}`, String(replacement)),
    String(value)
  );
};

export default {
  getDirection,
  getLanguage,
  setLanguage,
  t,
};