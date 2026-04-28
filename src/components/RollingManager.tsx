'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, Plus, X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSettlementStore, RollingEntry } from '@/lib/store';
import { deriveRevenueAPercentFromRate } from '@/lib/calculator';
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
      <SelectTrigger size="sm" className="h-11 w-[88px] shrink-0 border-border/40 bg-surface text-secondary-foreground sm:h-9 sm:w-[100px]">
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

function RollingFeeRow({
  label,
  feeAmount,
  feePercent,
  rollingAmount,
  currency,
  onFeePercentChange,
}: {
  label: string;
  feeAmount: number;
  feePercent: number;
  rollingAmount: number;
  currency: Currency;
  onFeePercentChange: (percent: number) => void;
}) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [localFeeAmount, setLocalFeeAmount] = useState('');

  const decimals = CURRENCY_CONFIG[currency].decimals;
  const displayAmount = feeAmount > 0 ? `-${formatNumber(feeAmount, decimals)}` : formatNumber(0, decimals);

  const handleFeeAmountFocus = () => {
    setEditingAmount(true);
    const rounded = Math.round(feeAmount * 100) / 100;
    setLocalFeeAmount(rounded === 0 ? '' : rounded.toString());
  };

  const handleFeeAmountBlur = () => {
    setEditingAmount(false);
    const parsed = parseFormattedNumber(localFeeAmount);
    if (rollingAmount > 0 && parsed >= 0) {
      const newPercent = Math.round((parsed / rollingAmount) * 1e9) / 1e7;
      onFeePercentChange(newPercent);
    }
    setLocalFeeAmount('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface/60 px-3 py-2.5 sm:grid sm:items-center sm:gap-3" style={{ gridTemplateColumns: '140px 110px 1fr' }}>
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground sm:justify-start">
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-1 rounded-md border border-brand-gold/25 bg-brand-gold/5 pl-1.5 pr-1 py-0.5">
          <Input
            type="number"
            inputMode="decimal"
            step={0.0000001}
            min={0}
            value={feePercent}
            onChange={(e) => onFeePercentChange(parseFloat(e.target.value) || 0)}
            className="h-8 w-14 border-0 bg-transparent px-0 text-center text-sm font-semibold tabular-nums text-brand-gold shadow-none focus-glow sm:h-7"
          />
          <span className="text-xs font-medium text-brand-gold/70">%</span>
        </span>
      </span>
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80 sm:text-xs">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          className="h-10 w-36 border-border/30 bg-transparent text-right text-sm tabular-nums font-semibold text-brand-red focus-glow sm:ml-auto sm:h-8 sm:w-32"
          value={editingAmount ? localFeeAmount : displayAmount}
          onFocus={handleFeeAmountFocus}
          onBlur={handleFeeAmountBlur}
          onChange={(e) => setLocalFeeAmount(e.target.value)}
          placeholder="0"
        />
      </div>
    </div>
  );
}

function RollingSection({
  entry,
  index,
  total,
  revenueAPercent,
  revenueBPercent,
  focusedField,
  localValue,
  onFocus,
  onBlur,
  onChange,
}: {
  entry: RollingEntry;
  index: number;
  total: number;
  revenueAPercent: number;
  revenueBPercent: number;
  focusedField: string | null;
  localValue: string;
  onFocus: (id: string, amount: number) => void;
  onBlur: () => void;
  onChange: (id: string, value: string) => void;
}) {
  const { t } = useTranslation();
  const removeRolling = useSettlementStore((s) => s.removeRolling);
  const setRollingCurrency = useSettlementStore((s) => s.setRollingCurrency);
  const setRollingFeePercent = useSettlementStore((s) => s.setRollingFeePercent);
  const setRollingTarget = useSettlementStore((s) => s.setRollingTarget);

  const label = String.fromCharCode(65 + index);
  const feeLabel = total > 1 ? `${t.input.rollingFee} ${label}` : t.input.rollingFee;
  const feeAmount = (entry.amount * entry.feePercent) / 100;
  const fieldId = entry.id;

  const displayValue = (() => {
    if (focusedField === fieldId) return localValue;
    if (entry.amount === 0) return '';
    return formatNumber(entry.amount, CURRENCY_CONFIG[entry.currency].decimals);
  })();

  return (
    <div className="slide-in space-y-2.5 rounded-xl border border-brand-gold/15 bg-surface/30 p-3.5 transition-colors hover:border-brand-gold/25">
      <div className="flex items-center justify-between">
        <div
          role="group"
          aria-label="Target"
          className="inline-flex items-center gap-0.5 rounded-full border border-border/40 bg-surface/70 p-0.5 shadow-inner"
        >
          <Button
            type="button"
            variant={entry.target === 'A' ? 'default' : 'ghost'}
            size="xs"
            aria-pressed={entry.target === 'A'}
            className={entry.target === 'A'
              ? 'rounded-full bg-brand-red text-white shadow-sm hover:bg-brand-red/85 text-xs h-7 px-2.5 sm:h-6 sm:px-3 font-semibold tracking-wide'
              : 'rounded-full border-0 text-muted-foreground text-xs h-7 px-2.5 sm:h-6 sm:px-3 font-medium tracking-wide hover:bg-transparent hover:text-foreground'}
            onClick={() => setRollingTarget(entry.id, 'A')}
          >
            {t.input.targetA} <span className="ml-1 tabular-nums opacity-80">{revenueAPercent.toFixed(2)}%</span>
          </Button>
          <Button
            type="button"
            variant={entry.target === 'B' ? 'default' : 'ghost'}
            size="xs"
            aria-pressed={entry.target === 'B'}
            className={entry.target === 'B'
              ? 'rounded-full bg-brand-red text-white shadow-sm hover:bg-brand-red/85 text-xs h-7 px-2.5 sm:h-6 sm:px-3 font-semibold tracking-wide'
              : 'rounded-full border-0 text-muted-foreground text-xs h-7 px-2.5 sm:h-6 sm:px-3 font-medium tracking-wide hover:bg-transparent hover:text-foreground'}
            onClick={() => setRollingTarget(entry.id, 'B')}
          >
            {t.input.targetB} <span className="ml-1 tabular-nums opacity-80">{revenueBPercent.toFixed(2)}%</span>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove rolling"
          className="size-9 shrink-0 rounded-full text-muted-foreground/60 transition-all hover:bg-brand-red/10 hover:text-brand-red active:scale-90 sm:size-7 sm:text-muted-foreground/50"
          onClick={() => removeRolling(entry.id)}
        >
          <X className="size-4 sm:size-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CurrencySelect value={entry.currency} onValueChange={(c) => setRollingCurrency(entry.id, c)} />
          <Input
            type="text"
            inputMode="decimal"
            className="h-11 flex-1 border-border/40 bg-surface text-right tabular-nums text-base font-medium text-foreground focus-glow sm:h-9"
            value={displayValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onFocus={() => onFocus(fieldId, entry.amount)}
            onBlur={onBlur}
            placeholder="0"
          />
        </div>
      </div>

      <RollingFeeRow
        label={feeLabel}
        feeAmount={feeAmount}
        feePercent={entry.feePercent}
        rollingAmount={entry.amount}
        currency={entry.currency}
        onFeePercentChange={(p) => setRollingFeePercent(entry.id, p)}
      />
    </div>
  );
}

export function RollingManager() {
  const { t } = useTranslation();
  const rollings = useSettlementStore((s) => s.rollings);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const autoRevenueSplitFromRate = useSettlementStore((s) => s.autoRevenueSplitFromRate);
  const inlineFxRate = useSettlementStore((s) => s.inlineFxRate);
  const setRollingAmount = useSettlementStore((s) => s.setRollingAmount);
  const addRolling = useSettlementStore((s) => s.addRolling);

  const effectiveRevenueAPercent = autoRevenueSplitFromRate && inlineFxRate > 0
    ? deriveRevenueAPercentFromRate(inlineFxRate)
    : revenueAPercent;
  const effectiveRevenueBPercent = Math.round((100 - effectiveRevenueAPercent) * 100) / 100;

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState('');

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
      setRollingAmount(field, parsed);
    },
    [setRollingAmount]
  );

  return (
    <Card className="premium-card border-border/40 bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <RotateCcw className="size-4 text-muted-foreground" />
          {t.input.rolling}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rollings.map((entry, index) => (
          <RollingSection
            key={entry.id}
            entry={entry}
            index={index}
            total={rollings.length}
            revenueAPercent={effectiveRevenueAPercent}
            revenueBPercent={effectiveRevenueBPercent}
            focusedField={focusedField}
            localValue={localValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        ))}

        {rollings.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full rounded-xl border-dashed border-brand-gold/30 text-sm font-medium text-brand-gold/80 transition-all hover:border-brand-gold/60 hover:bg-brand-gold/5 hover:text-brand-gold active:scale-[0.99] sm:h-9"
            onClick={addRolling}
          >
            <Plus className="mr-1.5 size-3.5" />
            {t.input.addRolling}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
