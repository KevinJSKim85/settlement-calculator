'use client';

import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === 'ko' ? 'zh' : 'ko')}
    >
      {language === 'ko' ? '中文' : '한국어'}
    </Button>
  );
}
