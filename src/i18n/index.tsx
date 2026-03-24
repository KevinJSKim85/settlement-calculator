'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ko, TranslationKeys } from './ko';
import { zh } from './zh';

type Language = 'ko' | 'zh';

const translations: Record<Language, any> = { ko, zh };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children, defaultLanguage = 'ko' }: { children: ReactNode; defaultLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

export type { Language, TranslationKeys };
