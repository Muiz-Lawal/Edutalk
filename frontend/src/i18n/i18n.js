import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enHost from './locales/en/host.json';
import enAdmin from './locales/en/admin.json';
import enClasses from './locales/en/classes.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esHost from './locales/es/host.json';
import esAdmin from './locales/es/admin.json';
import esClasses from './locales/es/classes.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frDashboard from './locales/fr/dashboard.json';
import frHost from './locales/fr/host.json';
import frAdmin from './locales/fr/admin.json';
import frClasses from './locales/fr/classes.json';

import deCommon from './locales/de/common.json';
import deAuth from './locales/de/auth.json';
import deDashboard from './locales/de/dashboard.json';
import deHost from './locales/de/host.json';
import deAdmin from './locales/de/admin.json';
import deClasses from './locales/de/classes.json';

import zhCommon from './locales/zh/common.json';
import zhAuth from './locales/zh/auth.json';
import zhDashboard from './locales/zh/dashboard.json';
import zhHost from './locales/zh/host.json';
import zhAdmin from './locales/zh/admin.json';
import zhClasses from './locales/zh/classes.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arHost from './locales/ar/host.json';
import arAdmin from './locales/ar/admin.json';
import arClasses from './locales/ar/classes.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    host: enHost,
    admin: enAdmin,
    classes: enClasses,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    host: esHost,
    admin: esAdmin,
    classes: esClasses,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    host: frHost,
    admin: frAdmin,
    classes: frClasses,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    dashboard: deDashboard,
    host: deHost,
    admin: deAdmin,
    classes: deClasses,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
    dashboard: zhDashboard,
    host: zhHost,
    admin: zhAdmin,
    classes: zhClasses,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    dashboard: arDashboard,
    host: arHost,
    admin: arAdmin,
    classes: arClasses,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'host', 'admin', 'classes'],
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
