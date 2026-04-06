'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, RotateCcw, Scale, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { formatNumber, parseFormattedNumber } from '@/lib/currency';
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
import { Button } from '@/components/ui/button';

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

function QuickAmountButtons({
  onAdd,
  labels,
  amounts,
}: {
  onAdd: (amount: number) => void;
  labels: string[];
  amounts?: number[];
}) {
  const quickAmounts = amounts ?? [10000, 100000, 1000000, 10000000, 100000000];

  return (
    <div className="flex flex-wrap gap-1">
      {quickAmounts.map((value, index) => (
        <Button
          key={value}
          type="button"
          variant="outline"
          size="xs"
          className="rounded-full border-brand-gold/30 text-brand-gold/80 transition-all hover:border-brand-gold/50 hover:bg-brand-gold/10 hover:text-brand-gold active:scale-95"
          onClick={() => onAdd(value)}
        >
          {labels[index]}
        </Button>
      ))}
    </div>
  );
}

function InputRow({
  label,
  icon,
  value,
  currency,
  quickAmountLabels,
  onValueChange,
  onCurrencyChange,
  onAddAmount,
  onFocus,
  onBlur,
  topExtra,
  footer,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  currency: Currency;
  quickAmountLabels: string[];
  onValueChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onAddAmount: (amount: number) => void;
  onFocus: () => void;
  onBlur: () => void;
  topExtra?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        {topExtra}
      </div>
      <div className="flex items-center gap-2">
        <CurrencySelect value={currency} onValueChange={onCurrencyChange} />
        <Input
          type="text"
          inputMode="decimal"
          className="flex-1 border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="0"
        />
      </div>
      {footer}
      <QuickAmountButtons onAdd={onAddAmount} labels={quickAmountLabels} />
    </div>
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
    <div className={`flex flex-col gap-1 rounded-xl px-4 py-3 sm:grid sm:items-center sm:gap-3 ${isNegative ? 'bg-brand-red/5 border border-brand-red/10' : 'bg-brand-gold/5 border border-brand-gold/10'}`} style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Scale className="size-4 text-muted-foreground" />
        {label}
        {isNegative && (
          <span className="text-xs font-semibold text-brand-red">({t.result.loss})</span>
        )}
      </span>
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-sm text-muted-foreground">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <span
          className={`text-right text-base tabular-nums font-bold ${
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
  const quickAmountLabels = [
    t.input.quickAdd1Man,
    t.input.quickAdd10Man,
    t.input.quickAdd100Man,
    t.input.quickAdd1000Man,
    t.input.quickAdd1Eok,
  ];
  const foreignQuickAmounts = [1, 5, 10, 50, 100, 500, 1000];
  const foreignQuickLabels = ['+1', '+5', '+10', '+50', '+100', '+500', '+1000'];
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
  const setBuyingCurrency = useSettlementStore((s) => s.setBuyingCurrency);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setReturningCurrency = useSettlementStore((s) => s.setReturningCurrency);
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

  const buyingBKrw = Math.round(storeBuyingB * (inlineFxRate || 1));
  const returningBKrw = Math.round(storeReturningB * (inlineFxRate || 1));
  const balance = isManual
    ? (storeBuyingA + buyingBKrw) - (storeReturningA + returningBKrw)
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

  const handleAddAmount = useCallback(
    (field: string, currentAmount: number, addValue: number) => {
      const newAmount = currentAmount + addValue;
      if (field === 'buying') setBuying(newAmount);
      else if (field === 'returning') setReturning(newAmount);
      else if (field === 'buyingA') setSBuyingA(newAmount);
      else if (field === 'buyingB') setSBuyingB(newAmount);
      else if (field === 'returningA') setSReturningA(newAmount);
      else if (field === 'returningB') setSReturningB(newAmount);
      if (focusedField === field) setLocalValue(newAmount.toString());
    },
    [focusedField, setBuying, setReturning, setSBuyingA, setSBuyingB, setSReturningA, setSReturningB]
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
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.code}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.code} onChange={(e) => setUserInfo('code', e.target.value)} placeholder={t.header.code} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.name}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.name} onChange={(e) => setUserInfo('name', e.target.value)} placeholder={t.header.name} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.date}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.date} onChange={(e) => setUserInfo('date', e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.location}</label>
            <Input type="text" className="h-8 border-border/40 bg-surface text-foreground focus-glow" value={userInfo.location} onChange={(e) => setUserInfo('location', e.target.value)} placeholder={t.header.location} />
          </div>
        </div>
        <div className="border-t border-border/20" />

        {/* Unified FX settings bar — always visible */}
        <div className="flex items-center gap-2 rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-3 py-2.5">
              <CurrencySelect value={inlineFxCurrency} onValueChange={setInlineFxCurrency} />
              <div className="flex flex-1 items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">{t.input.fxRate}</span>
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
                  className="h-7 flex-1 border-brand-gold/20 bg-surface text-right text-sm tabular-nums text-foreground focus-glow"
                  placeholder="0"
                />
              </div>
            </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSplitMode(isManual ? 'auto' : 'manual')}
            className="flex items-center gap-1.5 rounded-full border border-border/40 px-2.5 py-1 text-xs transition-colors hover:border-brand-gold/40 hover:bg-brand-gold/5"
          >
            {isManual
              ? <ToggleRight className="size-3.5 text-brand-gold" />
              : <ToggleLeft className="size-3.5 text-muted-foreground" />}
            <span className={isManual ? 'font-medium text-brand-gold' : 'text-muted-foreground'}>
              {t.input.splitManual}
            </span>
          </button>
        </div>

        {isManual ? (
          <>
            {/* Buying A/B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><ShoppingCart className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.buying}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-red">A (KRW ₩)</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingA', storeBuyingA, 'KRW')}
                    onChange={(e) => handleChange('buyingA', e.target.value)}
                    onFocus={() => handleFocus('buyingA', storeBuyingA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  <QuickAmountButtons onAdd={(val) => handleAddAmount('buyingA', storeBuyingA, val)} labels={quickAmountLabels} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-gold">B ({inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol})</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingB', storeBuyingB, 'KRW')}
                    onChange={(e) => handleChange('buyingB', e.target.value)}
                    onFocus={() => handleFocus('buyingB', storeBuyingB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {inlineFxRate > 0 && storeBuyingB > 0 && (
                    <div className="text-right text-xs tabular-nums text-muted-foreground">
                      → KRW ₩ {formatNumber(Math.round(storeBuyingB * inlineFxRate), 0)}
                    </div>
                  )}
                  <QuickAmountButtons onAdd={(val) => handleAddAmount('buyingB', storeBuyingB, val)} labels={foreignQuickLabels} amounts={foreignQuickAmounts} />
                </div>
              </div>
            </div>

            <div className="border-t border-border/20" />

            {/* Returning A/B */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><RotateCcw className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.returning}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-red">A (KRW ₩)</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningA', storeReturningA, 'KRW')}
                    onChange={(e) => handleChange('returningA', e.target.value)}
                    onFocus={() => handleFocus('returningA', storeReturningA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  <QuickAmountButtons onAdd={(val) => handleAddAmount('returningA', storeReturningA, val)} labels={quickAmountLabels} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-gold">B ({inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol})</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningB', storeReturningB, 'KRW')}
                    onChange={(e) => handleChange('returningB', e.target.value)}
                    onFocus={() => handleFocus('returningB', storeReturningB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                  {inlineFxRate > 0 && storeReturningB > 0 && (
                    <div className="text-right text-xs tabular-nums text-muted-foreground">
                      → KRW ₩ {formatNumber(Math.round(storeReturningB * inlineFxRate), 0)}
                    </div>
                  )}
                  <QuickAmountButtons onAdd={(val) => handleAddAmount('returningB', storeReturningB, val)} labels={foreignQuickLabels} amounts={foreignQuickAmounts} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Buying */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><ShoppingCart className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.buying}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="rounded-lg border border-border/40 bg-surface px-2.5 py-1.5">
                  <div className="text-[10px] text-muted-foreground">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayValue('foreignAmt', inlineForeignAmount, 'KRW')}
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
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                    placeholder="0"
                  />
                </div>
                <span className="text-muted-foreground/50">→</span>
                <div className="rounded-lg border border-border/40 bg-surface/60 px-2.5 py-1.5">
                  <div className="text-[10px] text-muted-foreground">KRW ₩</div>
                  <Input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="h-7 cursor-default border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                    value={buying.amount === 0 ? '' : formatNumber(buying.amount, 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <QuickAmountButtons
                onAdd={(val) => {
                  const newAmt = inlineForeignAmount + val;
                  setInlineForeignAmount(newAmt);
                  if (inlineFxRate > 0) setBuying(Math.round(newAmt * inlineFxRate));
                }}
                labels={foreignQuickLabels}
                amounts={foreignQuickAmounts}
              />
            </div>

            <div className="border-t border-border/20" />

            {/* Returning */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><RotateCcw className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.returning}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="rounded-lg border border-border/40 bg-surface px-2.5 py-1.5">
                  <div className="text-[10px] text-muted-foreground">{inlineFxCurrency} {CURRENCY_CONFIG[inlineFxCurrency].symbol}</div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={getDisplayValue('retForeignAmt', inlineRetForeignAmount, 'KRW')}
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
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                    placeholder="0"
                  />
                </div>
                <span className="text-muted-foreground/50">→</span>
                <div className="rounded-lg border border-border/40 bg-surface px-2.5 py-1.5">
                  <div className="text-[10px] text-muted-foreground">KRW ₩</div>
                  <Input
                    type="text"
                    readOnly
                    className="h-7 border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                    value={returning.amount === 0 ? '' : formatNumber(returning.amount, 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <QuickAmountButtons
                onAdd={(val) => {
                  const newAmt = inlineRetForeignAmount + val;
                  setInlineRetForeignAmount(newAmt);
                  if (inlineFxRate > 0) setReturning(Math.round(newAmt * inlineFxRate));
                }}
                labels={foreignQuickLabels}
                amounts={foreignQuickAmounts}
              />
            </div>
          </>
        )}

        <ComputedRow
          label={t.input.balance}
          value={balance}
          currency={returning.currency}
          isNegative={balance < 0}
        />

      </CardContent>
    </Card>
  );
}
