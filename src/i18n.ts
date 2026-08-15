import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

// Guard: prevents duplicate init (which creates a second, stale i18n instance
// during Vite hot-reload — the root cause of "some text needs a refresh to update")
if (!i18n.isInitialized) {
  i18n
    // Detect user language from browser settings / localStorage
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
        de: { translation: de },
      },

      // Explicitly define supported languages
      supportedLngs: ['fr', 'de', 'en'],

      // Fallback language (Default to French for Geneva / Switzerland targeting)
      fallbackLng: 'en',

      // Whitelist language code matching (e.g., 'fr-CH' will map to 'fr')
      nonExplicitSupportedLngs: true,

      // Language Detector Settings
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'], // Save language selection to localStorage
      },

      interpolation: {
        escapeValue: false, // React already escapes values
      },

      react: {
        useSuspense: false, // Set to true if you are using React Suspense for lazy loading
      },
    });

  i18n.on('languageChanged', (lng) => {
    document.documentElement.setAttribute('lang', lng);
  });
}

export default i18n;