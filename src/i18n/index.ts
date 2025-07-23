
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import thTranslations from './locales/th.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      th: {
        translation: thTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    lng: localStorage.getItem('i18nextLng') || 'th', // default language is Thai or last selected
    fallbackLng: 'th', // fallback is Thai
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
