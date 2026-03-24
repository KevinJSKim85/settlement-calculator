'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { fetchExchangeRates, isRateStale } from '@/lib/exchange-rate';
import { CURRENCIES, CURRENCY_CONFIG } from '@/types/currency';
import type { Currency } from '@/types/currency';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

export function SettingsPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const rollingFeePercent = useSettlementStore((s) => s.rollingFeePercent);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const baseCurrency = useSettlementStore((s) => s.baseCurrency);
  const exchangeRateData = useSettlementStore((s) => s.exchangeRateData);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const setRollingFeePercent = useSettlementStore((s) => s.setRollingFeePercent);
  const setRevenueAPercent = useSettlementStore((s) => s.setRevenueAPercent);
  const setBaseCurrency = useSettlementStore((s) => s.setBaseCurrency);
  const setExchangeRateData = useSettlementStore((s) => s.setExchangeRateData);
  const setManualExchangeRate = useSettlementStore((s) => s.setManualExchangeRate);

  const revenueBPercent = 100 - revenueAPercent;

  const handleFetchRates = async () => {
    setIsLoadingRates(true);
    try {
      const data = await fetchExchangeRates(baseCurrency);
      if (data) {
        setExchangeRateData(data);
      } else {
        toast.error(t.errors.apiError);
      }
    } catch {
      toast.error(t.errors.apiError);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const stale = exchangeRateData
    ? isRateStale(exchangeRateData.fetchedAt)
    : false;

  const nonBaseCurrencies = CURRENCIES.filter((c) => c !== baseCurrency);

  const getEffectiveRate = (currency: Currency): string => {
    if (manualExchangeRates[currency] !== undefined) {
      return String(manualExchangeRates[currency]);
    }
    if (exchangeRateData?.rates[currency] !== undefined) {
      return String(exchangeRateData.rates[currency]);
    }
    return '';
  };

  return (
    <Card size="sm">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle>{t.settings.title}</CardTitle>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>{t.settings.rollingFeePercent}</Label>
            <Input
              type="number"
              inputMode="decimal"
              step={0.1}
              min={0}
              value={rollingFeePercent}
              onChange={(e) =>
                setRollingFeePercent(parseFloat(e.target.value) || 0)
              }
              className="focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <Label>{t.result.revenueA}/{t.result.revenueB}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">
                {t.result.revenueA}:
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={revenueAPercent}
                onChange={(e) =>
                  setRevenueAPercent(parseFloat(e.target.value) || 0)
                }
                className="w-20 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">|</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t.result.revenueB}: {revenueBPercent}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t.settings.baseCurrency}</Label>
            <Select
              value={baseCurrency}
              onValueChange={(val) => { if (val) setBaseCurrency(val as Currency); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} {CURRENCY_CONFIG[c].symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Label>{t.settings.exchangeRates}</Label>
                {stale && (
                  <Badge
                    variant="outline"
                    className="border-yellow-500/50 bg-yellow-500/10 text-yellow-600"
                  >
                    {t.settings.rateStale}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoadingRates}
                onClick={handleFetchRates}
                className="w-full sm:w-auto"
              >
                {isLoadingRates ? '...' : t.settings.fetchRates}
              </Button>
            </div>

            <div className="space-y-1.5">
              {nonBaseCurrencies.map((currency) => (
                <div key={currency} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 shrink-0 text-sm text-muted-foreground">
                    1 {baseCurrency} =
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min={0}
                    value={getEffectiveRate(currency)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val) && val >= 0) {
                        setManualExchangeRate(currency, val);
                      }
                    }}
                    className="w-28 flex-1 sm:flex-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {currency} {CURRENCY_CONFIG[currency].symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
