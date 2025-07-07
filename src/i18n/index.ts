
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import thTranslations from './locales/th.json';
import enTranslations from './locales/en.json';

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
    lng: 'th', // default language
    fallbackLng: 'th',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
