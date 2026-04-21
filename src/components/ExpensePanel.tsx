'use client';

import { useState, useCallback } from 'react';
import { Receipt, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { formatNumber, parseFormattedNumber } from '@/lib/currency';
import { CURRENCY_CONFIG } from '@/types';
import type { Currency } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ExpenseRowProps {
  label: string;
  valueA: number;
  valueB: number;
  disabled?: boolean;
  disabledHint?: string;
  onChangeA: (value: number) => void;
  onChangeB: (value: number) => void;
  extra?: React.ReactNode;
  foreignMode?: boolean;
  foreignCurrency?: Currency;
  foreignRate?: number;
}

function ExpenseRow({
  label,
  valueA,
  valueB,
  disabled,
  disabledHint,
  onChangeA,
  onChangeB,
  extra,
  foreignMode,
  foreignCurrency,
  foreignRate,
}: ExpenseRowProps) {
  const [focusedField, setFocusedField] = useState<'A' | 'B' | null>(null);
  const [localValue, setLocalValue] = useState('');

  // In foreign mode, BOTH A and B accept foreign currency amounts
  const decimals = foreignMode && foreignCurrency
    ? CURRENCY_CONFIG[foreignCurrency].decimals
    : 0;

  const handleFocus = useCallback((side: 'A' | 'B', amount: number) => {
    setFocusedField(side);
    setLocalValue(amount === 0 ? '' : String(amount));
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
    setLocalValue('');
  }, []);

  const handleChange = useCallback((side: 'A' | 'B', raw: string) => {
    setLocalValue(raw);
    const parsed = parseFormattedNumber(raw);
    if (side === 'A') onChangeA(parsed);
    else onChangeB(parsed);
  }, [onChangeA, onChangeB]);

  const displayA = focusedField === 'A' ? localValue : (valueA === 0 ? '' : formatNumber(valueA, decimals));
  const displayB = focusedField === 'B' ? localValue : (valueB === 0 ? '' : formatNumber(valueB, decimals));

  const currencySuffix = foreignMode && foreignCurrency
    ? ` (${foreignCurrency} ${CURRENCY_CONFIG[foreignCurrency].symbol})`
    : '';
  const rate = foreignRate ?? 0;
  const showKrwA = foreignMode && rate > 0 && valueA !== 0;
  const showKrwB = foreignMode && rate > 0 && valueB !== 0;
  const krwA = showKrwA ? Math.round(valueA * rate) : 0;
  const krwB = showKrwB ? Math.round(valueB * rate) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {disabled && disabledHint && (
          <span className="truncate text-[11px] text-muted-foreground/70">{disabledHint}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="truncate text-xs font-medium text-brand-red">{`A${currencySuffix}`}</span>
          <Input
            type="text"
            inputMode="decimal"
            className="min-w-0 border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
            value={displayA}
            onChange={(e) => handleChange('A', e.target.value)}
            onFocus={() => handleFocus('A', valueA)}
            onBlur={handleBlur}
            placeholder="0"
            disabled={disabled}
          />
          {showKrwA && (
            <div className="flex items-center justify-end gap-1 text-[11px] tabular-nums text-muted-foreground">
              <ArrowRight className="size-3 text-brand-red/60" aria-hidden />
              <span className="font-medium">KRW ₩ {formatNumber(krwA, 0)}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <span className="truncate text-xs font-medium text-brand-gold">{`B${currencySuffix}`}</span>
          <Input
            type="text"
            inputMode="decimal"
            className="min-w-0 border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
            value={displayB}
            onChange={(e) => handleChange('B', e.target.value)}
            onFocus={() => handleFocus('B', valueB)}
            onBlur={handleBlur}
            placeholder="0"
            disabled={disabled}
          />
          {showKrwB && (
            <div className="flex items-center justify-end gap-1 text-[11px] tabular-nums text-muted-foreground">
              <ArrowRight className="size-3 text-brand-gold/60" aria-hidden />
              <span className="font-medium">KRW ₩ {formatNumber(krwB, 0)}</span>
            </div>
          )}
        </div>
      </div>
      {extra}
    </div>
  );
}

export function ExpensePanel() {
  const { t } = useTranslation();
  const expenses = useSettlementStore((s) => s.expenses);
  const expensesEnabled = useSettlementStore((s) => s.expensesEnabled);
  const setExpensesEnabled = useSettlementStore((s) => s.setExpensesEnabled);
  const setExpenseField = useSettlementStore((s) => s.setExpenseField);
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const autoRevenueSplitFromRate = useSettlementStore((s) => s.autoRevenueSplitFromRate);
  const splitMode = useSettlementStore((s) => s.splitMode);
  const storeBuyingA = useSettlementStore((s) => s.buyingA);
  const storeBuyingB = useSettlementStore((s) => s.buyingB);
  const storeReturningA = useSettlementStore((s) => s.returningA);
  const storeReturningB = useSettlementStore((s) => s.returningB);
  const inlineFxRate = useSettlementStore((s) => s.inlineFxRate);
  const inlineFxCurrency = useSettlementStore((s) => s.inlineFxCurrency);

  // Tax percent focus state
  const [taxPercentFocused, setTaxPercentFocused] = useState(false);
  const [taxPercentLocal, setTaxPercentLocal] = useState('');

  const buyingRate = manualExchangeRates[buying.currency] ?? 0;

  // Foreign mode for B column is active when an inline FX rate is set
  const foreignMode = inlineFxRate > 0;

  // Determine if loss (returning > buying) — disable tax
  const isManual = splitMode === 'manual';
  // storeBuyingB/storeReturningB are foreign amounts when inlineFxRate>0 in manual mode
  const manualBuyingBKrw = foreignMode ? Math.round(storeBuyingB * inlineFxRate) : storeBuyingB;
  const manualReturningBKrw = foreignMode ? Math.round(storeReturningB * inlineFxRate) : storeReturningB;
  const totalBuying = isManual ? storeBuyingA + manualBuyingBKrw : buying.amount;
  const totalReturning = isManual ? storeReturningA + manualReturningBKrw : returning.amount;
  const isLoss = totalReturning > totalBuying;

  // Compute effective revenue A% (same logic as MemberManager)
  const effectiveRevenueAPercent = autoRevenueSplitFromRate && buying.currency !== 'KRW' && buyingRate > 0
    ? Math.max(0, Math.min(100, Math.round(((100 / buyingRate) * 100) * 100) / 100))
    : revenueAPercent;
  const revenueBPercent = 100 - effectiveRevenueAPercent;

  // Compute buying/returning in KRW for tax calculation
  const buyingKrw = buying.currency === 'KRW' ? buying.amount : buying.amount * buyingRate;
  const buyingABase = isManual ? storeBuyingA : Math.round(buyingKrw * effectiveRevenueAPercent / 100);
  const buyingBBase = isManual ? manualBuyingBKrw : buyingKrw - buyingABase;
  const returningRate = manualExchangeRates[returning.currency] ?? 0;
  const returningKrw = returning.currency === 'KRW' ? returning.amount : returning.amount * returningRate;
  const returningABase = isManual ? storeReturningA : Math.round(returningKrw * effectiveRevenueAPercent / 100);
  const returningBBase = isManual ? manualReturningBKrw : returningKrw - returningABase;

  const revenueABeforeTax = buyingABase - returningABase;
  const revenueBBeforeTax = buyingBBase - returningBBase;

  // Handle tax percent change → auto compute tax amounts (in foreign when foreignMode)
  const handleTaxPercentChange = useCallback((raw: string) => {
    setTaxPercentLocal(raw);
    const percent = parseFloat(raw) || 0;
    setExpenseField('taxPercent', percent);
    if (!isLoss && percent > 0) {
      const taxAKrw = revenueABeforeTax * percent / 100;
      const taxBKrw = revenueBBeforeTax * percent / 100;
      const taxA = foreignMode && inlineFxRate > 0
        ? Math.round(taxAKrw / inlineFxRate)
        : Math.round(taxAKrw);
      const taxB = foreignMode && inlineFxRate > 0
        ? Math.round(taxBKrw / inlineFxRate)
        : Math.round(taxBKrw);
      setExpenseField('taxA', Math.max(0, taxA));
      setExpenseField('taxB', Math.max(0, taxB));
    }
  }, [isLoss, revenueABeforeTax, revenueBBeforeTax, setExpenseField, foreignMode, inlineFxRate]);

  // Handle tax amount A change → recalc percent
  // When foreignMode, `value` is foreign; convert to KRW for percent calc.
  const handleTaxAChange = useCallback((value: number) => {
    setExpenseField('taxA', value);
    if (revenueABeforeTax > 0) {
      const valueKrw = foreignMode && inlineFxRate > 0 ? value * inlineFxRate : value;
      const newPercent = Math.round((valueKrw / revenueABeforeTax) * 10000) / 100;
      setExpenseField('taxPercent', newPercent);
      // Also update B based on new percent
      const taxBKrw = revenueBBeforeTax * newPercent / 100;
      const taxB = foreignMode && inlineFxRate > 0
        ? Math.round(taxBKrw / inlineFxRate)
        : Math.round(taxBKrw);
      setExpenseField('taxB', Math.max(0, taxB));
    }
  }, [revenueABeforeTax, revenueBBeforeTax, setExpenseField, foreignMode, inlineFxRate]);

  // Handle tax amount B change → recalc percent
  // When foreignMode, `value` is foreign; convert to KRW for percent calc.
  const handleTaxBChange = useCallback((value: number) => {
    setExpenseField('taxB', value);
    if (revenueBBeforeTax > 0) {
      const valueKrw = foreignMode && inlineFxRate > 0 ? value * inlineFxRate : value;
      const newPercent = Math.round((valueKrw / revenueBBeforeTax) * 10000) / 100;
      setExpenseField('taxPercent', newPercent);
      // Also update A based on new percent
      const taxAKrw = revenueABeforeTax * newPercent / 100;
      const taxA = foreignMode && inlineFxRate > 0
        ? Math.round(taxAKrw / inlineFxRate)
        : Math.round(taxAKrw);
      setExpenseField('taxA', Math.max(0, taxA));
    }
  }, [revenueABeforeTax, revenueBBeforeTax, setExpenseField, foreignMode, inlineFxRate]);

  const totalA = expenses.costA + expenses.tipA + expenses.markA + expenses.taxA;
  const totalB = expenses.costB + expenses.tipB + expenses.markB + expenses.taxB;
  const totalAKrw = foreignMode && inlineFxRate > 0 ? Math.round(totalA * inlineFxRate) : totalA;
  const totalBKrw = foreignMode && inlineFxRate > 0 ? Math.round(totalB * inlineFxRate) : totalB;
  const decimals = foreignMode ? CURRENCY_CONFIG[inlineFxCurrency].decimals : 0;

  return (
    <Card className="premium-card border-border/40 bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpensesEnabled(!expensesEnabled)}
            className="flex items-center gap-2 text-foreground transition-colors hover:text-brand-gold"
          >
            {expensesEnabled ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <Receipt className="size-4 text-muted-foreground" />
            <span className="text-base font-semibold">{t.expenses.title}</span>
          </button>
          <button
            type="button"
            onClick={() => setExpensesEnabled(!expensesEnabled)}
            className="flex items-center gap-1.5 rounded-full border border-border/40 px-2.5 py-1 text-xs transition-colors hover:border-brand-gold/40 hover:bg-brand-gold/5"
          >
            {expensesEnabled
              ? <ToggleRight className="size-3.5 text-brand-gold" />
              : <ToggleLeft className="size-3.5 text-muted-foreground" />}
            <span className={expensesEnabled ? 'font-medium text-brand-gold' : 'text-muted-foreground'}>
              {expensesEnabled ? t.expenses.apply : t.expenses.unapply}
            </span>
          </button>
        </div>
      </CardHeader>
      {expensesEnabled && (
      <CardContent className="space-y-4">
        <ExpenseRow
          label={t.expenses.cost}

          valueA={expenses.costA}
          valueB={expenses.costB}
          onChangeA={(v) => setExpenseField('costA', v)}
          onChangeB={(v) => setExpenseField('costB', v)}
          foreignMode={foreignMode}
          foreignCurrency={inlineFxCurrency}
          foreignRate={inlineFxRate}
        />

        <ExpenseRow
          label={t.expenses.tip}

          valueA={expenses.tipA}
          valueB={expenses.tipB}
          onChangeA={(v) => setExpenseField('tipA', v)}
          onChangeB={(v) => setExpenseField('tipB', v)}
          foreignMode={foreignMode}
          foreignCurrency={inlineFxCurrency}
          foreignRate={inlineFxRate}
        />

        <ExpenseRow
          label={t.expenses.mark}

          valueA={expenses.markA}
          valueB={expenses.markB}
          onChangeA={(v) => setExpenseField('markA', v)}
          onChangeB={(v) => setExpenseField('markB', v)}
          foreignMode={foreignMode}
          foreignCurrency={inlineFxCurrency}
          foreignRate={inlineFxRate}
        />

        <ExpenseRow
          label={t.expenses.tax}

          valueA={expenses.taxA}
          valueB={expenses.taxB}
          disabled={isLoss}
          disabledHint={isLoss ? t.expenses.taxDisabled : undefined}
          onChangeA={handleTaxAChange}
          onChangeB={handleTaxBChange}
          foreignMode={foreignMode}
          foreignCurrency={inlineFxCurrency}
          foreignRate={inlineFxRate}
          extra={
            <div className="flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">{t.expenses.taxPercent}</span>
              <Input
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                value={taxPercentFocused ? taxPercentLocal : expenses.taxPercent}
                onFocus={() => {
                  setTaxPercentFocused(true);
                  setTaxPercentLocal(expenses.taxPercent === 0 ? '' : String(expenses.taxPercent));
                }}
                onBlur={() => {
                  setTaxPercentFocused(false);
                  setTaxPercentLocal('');
                }}
                onChange={(e) => handleTaxPercentChange(e.target.value)}
                disabled={isLoss}
                className="h-6 w-16 border-brand-gold/20 bg-surface px-1.5 text-center text-xs tabular-nums text-brand-gold focus-glow"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          }
        />

        {/* Totals */}
        <div className="border-t border-border/20 pt-3">
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium text-foreground">{t.expenses.total}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
              {foreignMode ? (
                <>
                  <span className="text-brand-red">
                    A: {formatNumber(totalA, decimals)} {inlineFxCurrency}
                    {totalA !== 0 && inlineFxRate > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        (→ KRW {formatNumber(totalAKrw, 0)})
                      </span>
                    )}
                  </span>
                  <span className="text-brand-gold">
                    B: {formatNumber(totalB, decimals)} {inlineFxCurrency}
                    {totalB !== 0 && inlineFxRate > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        (→ KRW {formatNumber(totalBKrw, 0)})
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-brand-red">A: {formatNumber(totalA, 0)} KRW</span>
                  <span className="text-brand-gold">B: {formatNumber(totalB, 0)} KRW</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
