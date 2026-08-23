import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { languagesList, Language } from './LanguageSelector';

const RTL_LANGUAGES = ['fa', 'ar', 'he', 'ur', 'ps', 'yi', 'sd', 'ku', 'ug'];

interface I18nContextType {
  i18n: typeof i18n;
  t: (key: string, options?: any) => string;
  language: string;
  isRTL: boolean;
  currentLanguageObj: Language;
  changeLanguage: (lang: string) => Promise<any>;
}

const defaultLangObj = languagesList.find(l => l.code === 'en') || languagesList[0];

const I18nContext = createContext<I18nContextType>({
  i18n,
  t: (key: string, options?: any) => i18n.t(key, options) as string,
  language: i18n.language || 'en',
  isRTL: false,
  currentLanguageObj: defaultLangObj,
  changeLanguage: (lang: string) => i18n.changeLanguage(lang),
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('i18nextLng');
      if (stored) return stored;
    }
    return i18n.language || 'en';
  });

  const isRTL = useMemo(() => RTL_LANGUAGES.includes(language), [language]);

  const currentLanguageObj = useMemo(() => {
    return languagesList.find(l => l.code === language) || {
      code: language,
      name: language.toUpperCase(),
      nativeName: language.toUpperCase(),
      flag: '🌐',
      region: 'Global',
    };
  }, [language]);

  useEffect(() => {
    // Synchronize HTML attributes for accessibility and CSS layout
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', language);
    }

    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', lng);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [isRTL, language]);

  const changeLanguage = async (langCode: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', langCode);
    }
    return i18n.changeLanguage(langCode);
  };

  const value: I18nContextType = {
    i18n,
    t: (key: string, options?: any) => i18n.t(key, options) as string,
    language,
    isRTL,
    currentLanguageObj,
    changeLanguage,
  };

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};

