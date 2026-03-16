import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import hi from "./hi.json";
import pa from "./pa.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      pa: { translation: pa },
    },
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;

export const tr = (text) => {
  if (!text) return "";
  return i18n.exists(text) ? i18n.t(text) : text;
};
