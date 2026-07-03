import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const changeLanguage = (code) => {
    try {
      localStorage.setItem('i18nextLng', code);
    } catch (e) {
      // ignore localStorage write errors
    }

    i18n.changeLanguage(code).catch(err => console.error('i18n changeLanguage error:', err));

    document.documentElement.lang = code;
    const isRTL = code === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.dir = isRTL ? 'rtl' : 'ltr';
    setIsOpen(false);
  };

  // Normalize language code (handle en-US, zh-CN, etc.)
  const activeLangCode = (i18n.language || i18n.resolvedLanguage || 'en').split('-')[0];
  const currentLang = languages.find(lang => lang.code === activeLangCode) || languages[0];

  return (
    <div className="language-switcher">
      <button
        className="language-button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        title={t('selectLanguage')}
        aria-label={t('selectLanguage')}
      >
        <span className="language-flag">{currentLang.flag}</span>
        <span className="language-code">{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${i18n.language === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="flag">{lang.flag}</span>
              <span className="name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
