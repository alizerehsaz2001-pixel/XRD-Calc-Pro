import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

interface I18nContextType {
  i18n: typeof i18n;
  t: (key: string, options?: any) => string;
  language: string;
  changeLanguage: (lang: string) => Promise<any>;
}

const I18nContext = createContext<I18nContextType>({
  i18n,
  t: (key: string, options?: any) => i18n.t(key, options) as string,
  language: i18n.language || 'en',
  changeLanguage: (lang: string) => i18n.changeLanguage(lang),
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const value: I18nContextType = {
    i18n,
    t: (key: string, options?: any) => i18n.t(key, options) as string,
    language,
    changeLanguage: (lang: string) => i18n.changeLanguage(lang),
  };

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};
