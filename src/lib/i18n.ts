import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en.json";
import he from "@/locales/he.json";

export const SUPPORTED_LANGS = ["en", "he"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const RTL_LANGS: SupportedLang[] = ["he"];

export const isRtl = (lng: string) => RTL_LANGS.includes(lng as SupportedLang);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "circlo_lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

const applyDir = (lng: string) => {
  const dir = isRtl(lng) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};

applyDir(i18n.language || "en");
i18n.on("languageChanged", applyDir);

export default i18n;
