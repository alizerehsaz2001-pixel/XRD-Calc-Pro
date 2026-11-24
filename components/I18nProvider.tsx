import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, {
  normalizeLanguageCode,
  isRTLLanguage,
  preloadCachedTranslations,
  subscribeTranslationStatus,
  getTranslationPendingState,
} from '../i18n';
import { languagesList, Language } from './LanguageSelector';

interface I18nContextType {
  i18n: typeof i18n;
  t: (key: string, options?: any) => string;
  language: string;
  isRTL: boolean;
  isTranslating: boolean;
  currentLanguageObj: Language;
  changeLanguage: (lang: string) => Promise<any>;
}

const defaultLangObj = languagesList.find((l) => l.code === 'en') || languagesList[0];

const I18nContext = createContext<I18nContextType>({
  i18n,
  t: (key: string, options?: any) => i18n.t(key, options) as string,
  language: 'en',
  isRTL: false,
  isTranslating: false,
  currentLanguageObj: defaultLangObj,
  changeLanguage: (lang: string) => i18n.changeLanguage(normalizeLanguageCode(lang)),
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('i18nextLng');
        if (stored && stored !== 'undefined') {
          return normalizeLanguageCode(stored);
        }
      } catch {}
    }
    return normalizeLanguageCode(i18n.language);
  });

  const [bundleRevision, setBundleRevision] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState<boolean>(() => getTranslationPendingState());

  const isRTL = useMemo(() => isRTLLanguage(language), [language]);

  const currentLanguageObj = useMemo(() => {
    return languagesList.find((l) => l.code === language) || defaultLangObj;
  }, [language]);

  // Register global i18next listeners ONCE (eliminates listener churn and render loops)
  useEffect(() => {
    const syncDocAttributes = (lng: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('dir', isRTLLanguage(lng) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lng);
      }
    };

    const initialNorm = normalizeLanguageCode(language);
    preloadCachedTranslations(initialNorm);
    syncDocAttributes(initialNorm);
    if (normalizeLanguageCode(i18n.language) !== initialNorm) {
      i18n.changeLanguage(initialNorm).catch(() => {});
    }

    const handleLanguageChange = (rawLng: string) => {
      const normalized = normalizeLanguageCode(rawLng);
      setLanguage((prev) => (prev === normalized ? prev : normalized));
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('i18nextLng', normalized);
        }
      } catch {}
      syncDocAttributes(normalized);
    };

    const handleStoreAdded = (addedLng: string) => {
      const normalizedAdded = normalizeLanguageCode(addedLng);
      const currentNorm = normalizeLanguageCode(i18n.language);
      if (normalizedAdded === currentNorm) {
        setBundleRevision((rev) => rev + 1);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    if (i18n.store && typeof i18n.store.on === 'function') {
      i18n.store.on('added', handleStoreAdded);
    }
    const unsubStatus = subscribeTranslationStatus(setIsTranslating);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      if (i18n.store && typeof i18n.store.off === 'function') {
        i18n.store.off('added', handleStoreAdded);
      }
      unsubStatus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(async (rawLangCode: string) => {
    const langCode = normalizeLanguageCode(rawLangCode);
    preloadCachedTranslations(langCode);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('i18nextLng', langCode);
      }
    } catch {}
    setLanguage(langCode);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRTLLanguage(langCode) ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', langCode);
    }
    return i18n.changeLanguage(langCode);
  }, []);

  const translateFn = useCallback(
    (key: string, options?: any) => {
      // Reference bundleRevision so consumers using useI18n().t update when async translations arrive
      void bundleRevision;
      return i18n.t(key, options) as string;
    },
    [language, bundleRevision]
  );

  const value = useMemo<I18nContextType>(
    () => ({
      i18n,
      t: translateFn,
      language,
      isRTL,
      isTranslating,
      currentLanguageObj,
      changeLanguage,
    }),
    [translateFn, language, isRTL, isTranslating, currentLanguageObj, changeLanguage]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
};
