'use client';

import { useState, useEffect, useRef } from 'react';
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
import { ChevronDown, ArrowRightLeft } from 'lucide-react';

const DEFAULT_SPREAD_PERCENT = 0.5;

function formatDateTime(date: Date | null): string {
  if (!date) return '-';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function SettingsPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [rateViewCurrency, setRateViewCurrency] = useState<Currency | null>(null);
  const [showBidAsk, setShowBidAsk] = useState(false);
  const [spreadPercent, setSpreadPercent] = useState(DEFAULT_SPREAD_PERCENT);

  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const baseCurrency = useSettlementStore((s) => s.baseCurrency);
  const exchangeRateData = useSettlementStore((s) => s.exchangeRateData);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const setRevenueAPercent = useSettlementStore((s) => s.setRevenueAPercent);
  const setBaseCurrency = useSettlementStore((s) => s.setBaseCurrency);
  const setExchangeRateData = useSettlementStore((s) => s.setExchangeRateData);
  const setManualExchangeRate = useSettlementStore((s) => s.setManualExchangeRate);

  const revenueBPercent = 100 - revenueAPercent;
  const viewBase = rateViewCurrency || baseCurrency;

  const prevBaseCurrencyRef = useRef(baseCurrency);
  useEffect(() => {
    if (prevBaseCurrencyRef.current !== baseCurrency) {
      prevBaseCurrencyRef.current = baseCurrency;
      setRateViewCurrency(null);
      fetchExchangeRates(baseCurrency).then((data) => {
        if (data) setExchangeRateData(data);
      });
    }
  }, [baseCurrency, setExchangeRateData]);

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

  const nonViewCurrencies = CURRENCIES.filter((c) => c !== viewBase);

  const getEffectiveRate = (currency: Currency): number | undefined => {
    const manualRate = manualExchangeRates[currency];
    const apiRate = exchangeRateData?.rates[currency];
    return manualRate ?? apiRate;
  };

  const getRateForView = (targetCurrency: Currency): number | undefined => {
    if (viewBase === baseCurrency) {
      return getEffectiveRate(targetCurrency);
    }
    const viewBaseRate = getEffectiveRate(viewBase);
    const targetRate = getEffectiveRate(targetCurrency);
    if (!viewBaseRate || viewBaseRate === 0) return undefined;
    if (targetCurrency === baseCurrency) return 1 / viewBaseRate;
    if (!targetRate) return undefined;
    return targetRate / viewBaseRate;
  };

  const getRateDisplay = (currency: Currency): string => {
    const rate = getRateForView(currency);
    if (rate === undefined) return '';
    if (rate >= 100) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  const getBidAsk = (currency: Currency): { bid: string; ask: string } | null => {
    const rate = getRateForView(currency);
    if (rate === undefined) return null;
    const halfSpread = spreadPercent / 100 / 2;
    const bid = rate * (1 - halfSpread);
    const ask = rate * (1 + halfSpread);
    const fmt = (v: number) => {
      if (v >= 100) return v.toFixed(2);
      if (v >= 1) return v.toFixed(4);
      return v.toFixed(6);
    };
    return { bid: fmt(bid), ask: fmt(ask) };
  };

  return (
    <Card size="sm" className="border-border/60 bg-card">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <CardTitle className="text-brand-gold/80">{t.settings.title}</CardTitle>
            <span className="text-xs text-muted-foreground">{t.settings.titleHint}</span>
          </div>
          <ChevronDown
            className={`size-4 text-brand-gold/50 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground/70">{t.result.revenueA}/{t.result.revenueB}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">
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
                className="w-20 border-border/60 bg-secondary text-foreground focus-visible:ring-2 focus-visible:ring-brand-red/60"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="hidden text-sm text-muted-foreground/40 sm:inline">|</span>
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                {t.result.revenueB}: {revenueBPercent}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70">{t.settings.baseCurrency}</Label>
            <Select
              value={baseCurrency}
              onValueChange={(val) => { if (val) setBaseCurrency(val as Currency); }}
            >
              <SelectTrigger className="w-full border-border/60 bg-secondary text-foreground">
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

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-foreground/70">{t.settings.exchangeRates}</Label>
                {stale && (
                  <Badge
                    variant="outline"
                    className="border-brand-red/40 bg-brand-red/10 text-brand-red"
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
                className="w-full border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 sm:w-auto"
              >
                {isLoadingRates ? '...' : t.settings.fetchRates}
              </Button>
            </div>

            {exchangeRateData && (
              <div className="space-y-1 rounded-lg border border-border/40 bg-surface px-3 py-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t.settings.apiUpdateTime}</span>
                  <span className="tabular-nums">{formatDateTime(exchangeRateData.apiUpdatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.settings.fetchedTime}</span>
                  <span className="tabular-nums">{formatDateTime(exchangeRateData.fetchedAt)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-foreground/60">{t.settings.viewCurrency}</Label>
                <Select
                  value={viewBase}
                  onValueChange={(val) => {
                    if (val === baseCurrency) {
                      setRateViewCurrency(null);
                    } else {
                      setRateViewCurrency(val as Currency);
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-[110px] border-border/60 bg-secondary text-secondary-foreground">
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
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowBidAsk(!showBidAsk)}
                className="text-xs text-muted-foreground hover:text-brand-gold"
              >
                <ArrowRightLeft className="mr-1 size-3" />
                {showBidAsk ? t.settings.hideBidAsk : t.settings.showBidAsk}
              </Button>
            </div>

            {showBidAsk && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-xs text-foreground/60">{t.settings.spread}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step={0.1}
                  min={0}
                  max={10}
                  value={spreadPercent}
                  onChange={(e) => setSpreadPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 border-border/60 bg-secondary text-foreground text-xs focus-visible:ring-2 focus-visible:ring-brand-red/60"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            )}

            <div className="space-y-2">
              {nonViewCurrencies.map((currency) => {
                const bidAsk = showBidAsk ? getBidAsk(currency) : null;
                return (
                  <div key={currency} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-24 shrink-0 text-sm text-muted-foreground">
                        1 {viewBase} =
                      </span>
                      {viewBase === baseCurrency ? (
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          value={getEffectiveRate(currency) !== undefined ? String(getEffectiveRate(currency)) : ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val >= 0) {
                              setManualExchangeRate(currency, val);
                            }
                          }}
                          className="w-28 flex-1 border-border/60 bg-secondary text-foreground focus-visible:ring-2 focus-visible:ring-brand-red/60 sm:flex-none"
                        />
                      ) : (
                        <span className="w-28 flex-1 rounded-md border border-border/40 bg-surface px-3 py-1.5 text-sm tabular-nums text-foreground sm:flex-none">
                          {getRateDisplay(currency) || '-'}
                        </span>
                      )}
                      <span className="whitespace-nowrap text-sm text-muted-foreground">
                        {currency} {CURRENCY_CONFIG[currency].symbol}
                      </span>
                    </div>
                    {bidAsk && (
                      <div className="ml-24 flex gap-3 pl-2 text-[11px] text-muted-foreground/70">
                        <span>{t.settings.buyRate} <span className="tabular-nums text-brand-red/80">{bidAsk.ask}</span></span>
                        <span>{t.settings.sellRate} <span className="tabular-nums text-brand-gold/80">{bidAsk.bid}</span></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
