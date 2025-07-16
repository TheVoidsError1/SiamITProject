
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
    lng: 'en', // default language is now English
    fallbackLng: 'en', // fallback is also English
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
