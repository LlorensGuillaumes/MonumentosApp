import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import ca from './locales/ca.json';
import eu from './locales/eu.json';
import gl from './locales/gl.json';

const deviceLanguage = getLocales()[0]?.languageCode || 'es';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      pt: { translation: pt },
      ca: { translation: ca },
      eu: { translation: eu },
      gl: { translation: gl },
    },
    supportedLngs: ['es', 'en', 'fr', 'pt', 'ca', 'eu', 'gl'],
    lng: deviceLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
