'use client';

import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { CURRENCIES, CURRENCY_CONFIG } from '@/types/currency';
import type { Currency } from '@/types/currency';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function SettingsPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const baseCurrency = useSettlementStore((s) => s.baseCurrency);
  const setBaseCurrency = useSettlementStore((s) => s.setBaseCurrency);

  return (
    <Card className="premium-card border-border/40 bg-card">
      <CardHeader
        className="cursor-pointer select-none transition-colors hover:bg-surface/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-muted-foreground" />
            <div className="flex items-baseline gap-1.5">
              <CardTitle className="text-foreground">{t.settings.title}</CardTitle>
              <span className="text-xs text-muted-foreground">{t.settings.titleHint}</span>
            </div>
          </div>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="slide-in space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground">{t.settings.baseCurrency}</Label>
            <Select
              value={baseCurrency}
              onValueChange={(val) => { if (val) setBaseCurrency(val as Currency); }}
            >
              <SelectTrigger className="w-full border-border/40 bg-surface text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency} {CURRENCY_CONFIG[currency].symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
