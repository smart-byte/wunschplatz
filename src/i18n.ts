import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import landingDe from './locales/de/landing.json';
import landingEn from './locales/en/landing.json';
import appDe from './locales/de/app.json';
import appEn from './locales/en/app.json';

export const LANG_STORAGE_KEY = 'wunschplatz-lang';

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { landing: landingDe, app: appDe },
      en: { landing: landingEn, app: appEn },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
