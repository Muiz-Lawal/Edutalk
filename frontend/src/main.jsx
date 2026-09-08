import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import './i18n/i18n'; // Initialize i18n
import App from './App.jsx';

let storedTheme = 'system';
try {
  storedTheme = localStorage.getItem('theme') || 'system';
} catch {
  storedTheme = 'system';
}
const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = storedTheme === 'system'
  ? (systemDark ? 'dark' : 'light')
  : storedTheme;
document.documentElement.dataset.themePreference = storedTheme;

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info('EduTalk is ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
