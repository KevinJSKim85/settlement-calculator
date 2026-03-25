'use client';

import { useTranslation } from '@/i18n';
import type { Language } from '@/i18n';
import { Button } from '@/components/ui/button';

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
    <Button
      variant="outline"
      size="sm"
      onClick={nextLang}
      className="border-border/60 text-muted-foreground transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
    >
      {LANG_LABELS[language]}
    </Button>
  );
}
