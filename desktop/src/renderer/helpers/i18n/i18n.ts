import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en_US from "./translations/en_US.json";
import pt_BR from "./translations/pt_BR.json";

export async function initI18n() {
  const saved =
    typeof localStorage !== "undefined" ? localStorage.getItem("i18nLng") : null;
  await i18n.use(initReactI18next).init({
    fallbackLng: "en-US",
    lng: saved && ["en-US", "pt-BR"].includes(saved) ? saved : "en-US",
    resources: {
      "en-US": {
        translation: en_US,
      },
      "pt-BR": {
        translation: pt_BR,
      },
    },
  });
}
