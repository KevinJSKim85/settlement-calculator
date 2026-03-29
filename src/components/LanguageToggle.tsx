'use client';

import { useTranslation } from '@/i18n';
import type { Language } from '@/i18n';

const LANG_ORDER: Language[] = ['ko', 'en', 'zh'];
const LANG_LABELS: Record<Language, string> = {
  ko: '한국어',
  en: 'EN',
  zh: '中文',
};

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const nextLang = () => {
    const idx = LANG_ORDER.indexOf(language);
    const next = LANG_ORDER[(idx + 1) % LANG_ORDER.length];
    setLanguage(next);
  };

  return (
    <button
      onClick={nextLang}
      className="flex h-8 items-center rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-gold"
    >
      {LANG_LABELS[language]}
    </button>
  );
}
