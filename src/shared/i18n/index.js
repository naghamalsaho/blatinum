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
};

const DICTS = { en, ar };

export const t = (key, variables = {}) => {
  const lang = getLanguage();
  const dict = DICTS[lang] || DICTS.ar;

  // يدعم المفاتيح المتداخلة مثل legal_contracts.title
  let value = key.split(".").reduce((obj, k) => obj?.[k], dict);

  // fallback للإنجليزي إذا المفتاح غير موجود باللغة الحالية
  if (value == null) {
    value = key
      .split(".")
      .reduce((obj, k) => obj?.[k], DICTS.en);
  }

  if (value == null) {
    value = key;
  }

  // يدعم المتغيرات مثل {name}
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