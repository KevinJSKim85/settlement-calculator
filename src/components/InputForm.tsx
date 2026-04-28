'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, RotateCcw, Scale, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { formatNumber, parseFormattedNumber } from '@/lib/currency';
import { calcManualBalanceB, calcSplitBalance } from '@/lib/calculator';
import { CURRENCIES, CURRENCY_CONFIG } from '@/types';
import type { Currency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function CurrencySelect({
  value,
  onValueChange,
}: {
  value: Currency;
  onValueChange: (currency: Currency) => void;
}) {
  return (
    <Select value={value} onValueChange={(val) => onValueChange(val as Currency)}>
      <SelectTrigger size="sm" className="w-[100px] shrink-0 border-border/40 bg-surface text-secondary-foreground">
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
  );
}

function ComputedRow({
  label,
  value,
  currency,
  isNegative,
}: {
  label: string;
  value: number;
  currency: Currency;
  isNegative?: boolean;
}) {
  const { t } = useTranslation();
  const decimals = CURRENCY_CONFIG[currency].decimals;
  const formatted = formatNumber(Math.abs(value), decimals);
  const sign = value < 0 ? '-' : '';
  const displayValue = `${sign}${formatted}`;

  return (
    <div
      className={`min-w-0 rounded-xl border px-4 py-3 ${
        isNegative ? 'border-brand-red/15 bg-brand-red/5' : 'border-brand-gold/15 bg-brand-gold/5'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <Scale className={`size-4 shrink-0 ${isNegative ? 'text-brand-red/70' : 'text-brand-gold/70'}`} />
        </span>
        <span
          className={`min-w-0 flex-1 text-right text-sm font-semibold ${
            isNegative ? 'text-brand-red' : 'text-brand-gold'
          }`}
        >
          <span className="break-words">{label}</span>
          {isNegative && (
            <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-red">
              ({t.result.loss})
            </span>
          )}
        </span>
      </div>
      <div className="mt-2 flex flex-col items-end gap-1 text-right">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <span
          className={`max-w-full break-all text-base font-bold leading-tight tabular-nums sm:text-lg ${
            isNegative ? 'text-brand-red' : 'text-brand-gold'
          }`}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}

export function InputForm() {
  const { t } = useTranslation();
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const splitMode = useSettlementStore((s) => s.splitMode);
  const storeBuyingA = useSettlementStore((s) => s.buyingA);
  const storeBuyingB = useSettlementStore((s) => s.buyingB);
  const storeReturningA = useSettlementStore((s) => s.returningA);
  const storeReturningB = useSettlementStore((s) => s.returningB);
  const inlineFxRate = useSettlementStore((s) => s.inlineFxRate);
  const inlineFxCurrency = useSettlementStore((s) => s.inlineFxCurrency);
  const inlineForeignAmount = useSettlementStore((s) => s.inlineForeignAmount);
  const inlineRetForeignAmount = useSettlementStore((s) => s.inlineRetForeignAmount);
  const setBuying = useSettlementStore((s) => s.setBuying);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setInlineFxRate = useSettlementStore((s) => s.setInlineFxRate);
  const setInlineFxCurrency = useSettlementStore((s) => s.setInlineFxCurrency);
  const setInlineForeignAmount = useSettlementStore((s) => s.setInlineForeignAmount);
  const setInlineRetForeignAmount = useSettlementStore((s) => s.setInlineRetForeignAmount);
  const setSplitMode = useSettlementStore((s) => s.setSplitMode);
  const setSBuyingA = useSettlementStore((s) => s.setBuyingA);
  const setSBuyingB = useSettlementStore((s) => s.setBuyingB);
  const setSReturningA = useSettlementStore((s) => s.setReturningA);
  const setSReturningB = useSettlementStore((s) => s.setReturningB);
  const userInfo = useSettlementStore((s) => s.userInfo);
  const setUserInfo = useSettlementStore((s) => s.setUserInfo);
  const isManual = splitMode === 'manual';

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState('');

  // When rate is 0, B values are treated as 0 KRW (can't convert without a rate)
  const buyingBKrw = inlineFxRate > 0 ? Math.round(storeBuyingB * inlineFxRate) : 0;
  const returningBKrw = inlineFxRate > 0 ? Math.round(storeReturningB * inlineFxRate) : 0;
  const balanceA = storeBuyingA - storeReturningA;
  const rawBalanceB = buyingBKrw - returningBKrw;
  const balanceB = isManual
    ? calcManualBalanceB(balanceA, rawBalanceB)
    : rawBalanceB;
  const balance = isManual
    ? calcSplitBalance(balanceA, balanceB)
    : buying.amount - returning.amount;

  const handleFocus = useCallback((field: string, amount: number) => {
    setFocusedField(field);
    setLocalValue(amount === 0 ? '' : amount.toString());
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
    setLocalValue('');
  }, []);

  const handleChange = useCallback(
    (field: string, value: string) => {
      setLocalValue(value);
      const parsed = parseFormattedNumber(value);
      if (field === 'buying') setBuying(parsed);
      else if (field === 'returning') setReturning(parsed);
      else if (field === 'buyingA') setSBuyingA(parsed);
      else if (field === 'buyingB') setSBuyingB(parsed);
      else if (field === 'returningA') setSReturningA(parsed);
      else if (field === 'returningB') setSReturningB(parsed);
    },
    [setBuying, setReturning, setSBuyingA, setSBuyingB, setSReturningA, setSReturningB]
  );

  const getDisplayValue = useCallback(
    (field: string, amount: number, currency: Currency) => {
      if (focusedField === field) return localValue;
      if (amount === 0) return '';
      return formatNumber(amount, CURRENCY_CONFIG[currency].decimals);
    },
    [focusedField, localValue]
  );

  return (
    <Card className="premium-card border-border/40 bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{t.app.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* User info header */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.header.code}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.code} onChange={(e) => setUserInfo('code', e.target.value)} placeholder={t.header.code} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.header.name}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.name} onChange={(e) => setUserInfo('name', e.target.value)} placeholder={t.header.name} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.header.date}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.date} onChange={(e) => setUserInfo('date', e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.header.location}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.location} onChange={(e) => setUserInfo('location', e.target.value)} placeholder={t.header.location} />
          </div>
        </div>
        <div className="border-t border-border/20" />

        {/* Unified FX settings bar — always visible */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-gold/25 bg-brand-gold/5 px-2.5 py-2 shadow-sm shadow-brand-gold/5 sm:flex-nowrap sm:px-3 sm:py-2.5">
              <CurrencySelect value={inlineFxCurrency} onValueChange={setInlineFxCurrency} />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{t.input.fxRate}</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={inlineFxRate > 0 ? String(inlineFxRate) : ''}
                  onChange={(e) => {
                    const rate = parseFormattedNumber(e.target.value);
                    setInlineFxRate(rate);
                    if (inlineForeignAmount > 0 && rate > 0) {
                      setBuying(Math.round(inlineForeignAmount * rate));
                    } else if (rate === 0) {
                      setBuying(0);
                    }
                    if (inlineRetForeignAmount > 0 && rate > 0) {
                      setReturning(Math.round(inlineRetForeignAmount * rate));
                    } else if (rate === 0) {
                      setReturning(0);
                    }
                  }}
                  className="h-9 min-w-0 flex-1 border-brand-gold/25 bg-surface text-right text-sm font-medium tabular-nums text-foreground focus-glow sm:h-8"
                  placeholder="0"
                />
              </div>
            </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSplitMode(isManual ? 'auto' : 'manual')}
            aria-pressed={isManual}
            className={`flex min-h-[36px] items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] sm:min-h-0 sm:py-1.5 ${
              isManual
                ? 'border-brand-gold/50 bg-brand-gold/10 text-brand-gold shadow-sm shadow-brand-gold/10'
                : 'border-border/50 bg-surface text-muted-foreground hover:border-brand-gold/40 hover:bg-brand-gold/5 hover:text-foreground'
            }`}
          >
            {isManual
              ? <ToggleRight className="size-4" />
              : <ToggleLeft className="size-4" />}
            <span>{t.input.splitManual}</span>
          </button>
        </div>

        {isManual ? (
          <>
            {/* Buying A/B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-brand-gold/10 text-brand-gold"><ShoppingCart className="size-3.5" /></span>
                <span className="text-sm font-semibold tracking-tight text-foreground">{t.input.buying}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-red sm:text-xs">
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-red/10 text-[10px] font-bold">A</span>
                    <span className="text-muted-foreground">KRW ₩</span>
                  </span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingA', storeBuyingA, 'KRW')}
                    onChange={(e) => handleChange('buyingA', e.target.value)}
                    onFocus={() => handleFocus('buyingA', storeBuyingA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />

                </div>
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-gold sm:text-xs">
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-gold/10 text-[10px] font-bold">B</span>
                    <span className="truncate text-muted-foreground">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</span>
                  </span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingB', storeBuyingB, inlineFxCurrency)}
                    onChange={(e) => handleChange('buyingB', e.target.value)}
                    onFocus={() => handleFocus('buyingB', storeBuyingB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {inlineFxRate > 0 && storeBuyingB > 0 && (
                    <div className="flex min-w-0 items-start justify-end gap-1 text-right text-[11px] tabular-nums text-muted-foreground">
                      <ArrowRight className="size-3 text-brand-gold/60" aria-hidden />
                      <span className="min-w-0 break-words font-medium">KRW ₩ {formatNumber(Math.round(storeBuyingB * inlineFxRate), 0)}</span>
                    </div>
                  )}

                </div>
              </div>
            </div>

            <div className="border-t border-border/20" />

            {/* Returning A/B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-brand-red/10 text-brand-red"><RotateCcw className="size-3.5" /></span>
                <span className="text-sm font-semibold tracking-tight text-foreground">{t.input.returning}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-red sm:text-xs">
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-red/10 text-[10px] font-bold">A</span>
                    <span className="text-muted-foreground">KRW ₩</span>
                  </span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningA', storeReturningA, 'KRW')}
                    onChange={(e) => handleChange('returningA', e.target.value)}
                    onFocus={() => handleFocus('returningA', storeReturningA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />

                </div>
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-gold sm:text-xs">
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-gold/10 text-[10px] font-bold">B</span>
                    <span className="truncate text-muted-foreground">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</span>
                  </span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningB', storeReturningB, inlineFxCurrency)}
                    onChange={(e) => handleChange('returningB', e.target.value)}
                    onFocus={() => handleFocus('returningB', storeReturningB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {inlineFxRate > 0 && storeReturningB > 0 && (
                    <div className="flex min-w-0 items-start justify-end gap-1 text-right text-[11px] tabular-nums text-muted-foreground">
                      <ArrowRight className="size-3 text-brand-gold/60" aria-hidden />
                      <span className="min-w-0 break-words font-medium">KRW ₩ {formatNumber(Math.round(storeReturningB * inlineFxRate), 0)}</span>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Buying */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-brand-gold/10 text-brand-gold"><ShoppingCart className="size-3.5" /></span>
                <span className="text-sm font-semibold tracking-tight text-foreground">{t.input.buying}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2.5">
                <div className="rounded-lg border border-border/50 bg-surface px-2.5 py-2 transition-colors focus-within:border-brand-gold/50 focus-within:bg-brand-gold/5 sm:px-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayValue('foreignAmt', inlineForeignAmount, inlineFxCurrency)}
                    onChange={(e) => {
                      const amt = parseFormattedNumber(e.target.value);
                      setInlineForeignAmount(amt);
                      if (inlineFxRate > 0 && amt > 0) {
                        setBuying(Math.round(amt * inlineFxRate));
                      } else if (amt === 0) {
                        setBuying(0);
                      }
                      setLocalValue(e.target.value);
                    }}
                    onFocus={() => handleFocus('foreignAmt', inlineForeignAmount)}
                    onBlur={handleBlur}
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm font-medium tabular-nums shadow-none focus-visible:ring-0"
                    placeholder="0"
                  />
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-brand-gold/60 sm:size-4" aria-hidden />
                <div className="rounded-lg border border-dashed border-border/40 bg-surface/40 px-2.5 py-2 sm:px-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">KRW ₩</div>
                  <Input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="h-7 cursor-default border-0 bg-transparent px-0 text-right text-sm font-medium tabular-nums text-foreground/90 shadow-none focus-visible:ring-0"
                    value={buying.amount === 0 ? '' : formatNumber(buying.amount, 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/20" />

            {/* Returning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-brand-red/10 text-brand-red"><RotateCcw className="size-3.5" /></span>
                <span className="text-sm font-semibold tracking-tight text-foreground">{t.input.returning}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 sm:gap-2.5">
                <div className="rounded-lg border border-border/50 bg-surface px-2.5 py-2 transition-colors focus-within:border-brand-gold/50 focus-within:bg-brand-gold/5 sm:px-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayValue('retForeignAmt', inlineRetForeignAmount, inlineFxCurrency)}
                    onChange={(e) => {
                      const amt = parseFormattedNumber(e.target.value);
                      setInlineRetForeignAmount(amt);
                      if (inlineFxRate > 0 && amt > 0) {
                        setReturning(Math.round(amt * inlineFxRate));
                      } else if (amt === 0) {
                        setReturning(0);
                      }
                      setLocalValue(e.target.value);
                    }}
                    onFocus={() => handleFocus('retForeignAmt', inlineRetForeignAmount)}
                    onBlur={handleBlur}
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm font-medium tabular-nums shadow-none focus-visible:ring-0"
                    placeholder="0"
                  />
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-brand-gold/60 sm:size-4" aria-hidden />
                <div className="rounded-lg border border-dashed border-border/40 bg-surface/40 px-2.5 py-2 sm:px-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">KRW ₩</div>
                  <Input
                    type="text"
                    readOnly
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm font-medium tabular-nums text-foreground/90 shadow-none focus-visible:ring-0"
                    value={returning.amount === 0 ? '' : formatNumber(returning.amount, 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {isManual && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ComputedRow
              label={`${t.input.balance} A`}
              value={balanceA}
              currency="KRW"
              isNegative={balanceA < 0}
            />
            <ComputedRow
              label={`${t.input.balance} B`}
              value={balanceB}
              currency="KRW"
              isNegative={balanceB < 0}
            />
          </div>
        )}

        <ComputedRow
          label={t.input.balance}
          value={balance}
          currency={isManual ? 'KRW' : returning.currency}
          isNegative={balance < 0}
        />

      </CardContent>
    </Card>
  );
}
