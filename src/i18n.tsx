import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import { programsEn, programsAm, programsOm } from "./player/i18n/programs";
import en from "./i18n/locales/en";
import am from "./i18n/locales/am";
import om from "./i18n/locales/om";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: false,
    interpolation: { escapeValue: false },
    resources: {
      en: { translation: en, programs: programsEn },
      am: { translation: am, programs: programsAm },
      om: { translation: om, programs: programsOm },
    },
  });

/**
 * Keeps the `<html lang>` attribute and the Amharic font class in sync with the
 * active language, so CSS and screen readers see the real language.
 */
function applyLanguageClass(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", lng);
  document.documentElement.classList.toggle("lang-am", lng === "am");
}

applyLanguageClass(i18n.language || i18n.resolvedLanguage || "en");
i18n.on("languageChanged", applyLanguageClass);

export default i18n;
