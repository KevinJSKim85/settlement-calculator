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
}: {
  onAdd: (amount: number) => void;
  labels: string[];
}) {
  const quickAmounts = [10000, 100000, 1000000, 10000000, 100000000];

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
      const newPercent = Math.round((parsed / rollingAmount) * 10000) / 100;
      onFeePercentChange(newPercent);
    }
    setLocalFeeAmount('');
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface/60 px-3 py-2.5 sm:grid sm:items-center sm:gap-3" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {label}
        <span className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0}
            value={feePercent}
            onChange={(e) => onFeePercentChange(parseFloat(e.target.value) || 0)}
            className="h-6 w-16 border-brand-gold/20 bg-surface px-1.5 text-center text-xs tabular-nums text-brand-gold focus-glow"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </span>
      </span>
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-sm text-muted-foreground">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          className="h-7 w-32 border-border/30 bg-transparent text-right text-sm tabular-nums font-medium text-brand-red focus-glow sm:ml-auto"
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
  quickAmountLabels,
  focusedField,
  localValue,
  onFocus,
  onBlur,
  onChange,
  onAddAmount,
}: {
  entry: RollingEntry;
  index: number;
  total: number;
  revenueAPercent: number;
  revenueBPercent: number;
  quickAmountLabels: string[];
  focusedField: string | null;
  localValue: string;
  onFocus: (id: string, amount: number) => void;
  onBlur: () => void;
  onChange: (id: string, value: string) => void;
  onAddAmount: (id: string, currentAmount: number, addValue: number) => void;
}) {
  const { t } = useTranslation();
  const removeRolling = useSettlementStore((s) => s.removeRolling);
  const setRollingCurrency = useSettlementStore((s) => s.setRollingCurrency);
  const setRollingFeePercent = useSettlementStore((s) => s.setRollingFeePercent);
  const setRollingTarget = useSettlementStore((s) => s.setRollingTarget);

  const label = String.fromCharCode(65 + index);
  const rollingLabel = total > 1 ? `${t.input.rolling} ${label}` : t.input.rolling;
  const feeLabel = total > 1 ? `${t.input.rollingFee} ${label}` : t.input.rollingFee;
  const feeAmount = (entry.amount * entry.feePercent) / 100;
  const fieldId = entry.id;

  const displayValue = (() => {
    if (focusedField === fieldId) return localValue;
    if (entry.amount === 0) return '';
    return formatNumber(entry.amount, CURRENCY_CONFIG[entry.currency].decimals);
  })();

  return (
    <div className="slide-in space-y-2 rounded-xl border border-brand-gold/15 bg-surface/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={entry.target === 'A' ? 'default' : 'outline'}
            size="xs"
            className={entry.target === 'A'
              ? 'rounded-full bg-brand-red text-white hover:bg-brand-red/80 text-xs h-6 px-2.5'
              : 'rounded-full border-border/40 text-muted-foreground text-xs h-6 px-2.5 hover:text-foreground'}
            onClick={() => setRollingTarget(entry.id, 'A')}
          >
            {t.input.targetA} {revenueAPercent}%
          </Button>
          <Button
            type="button"
            variant={entry.target === 'B' ? 'default' : 'outline'}
            size="xs"
            className={entry.target === 'B'
              ? 'rounded-full bg-brand-red text-white hover:bg-brand-red/80 text-xs h-6 px-2.5'
              : 'rounded-full border-border/40 text-muted-foreground text-xs h-6 px-2.5 hover:text-foreground'}
            onClick={() => setRollingTarget(entry.id, 'B')}
          >
            {t.input.targetB} {revenueBPercent}%
          </Button>
        </div>
        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/60 hover:text-brand-red"
            onClick={() => removeRolling(entry.id)}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CurrencySelect value={entry.currency} onValueChange={(c) => setRollingCurrency(entry.id, c)} />
          <Input
            type="text"
            inputMode="decimal"
            className="flex-1 border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
            value={displayValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onFocus={() => onFocus(fieldId, entry.amount)}
            onBlur={onBlur}
            placeholder="0"
          />
        </div>
        <QuickAmountButtons onAdd={(val) => onAddAmount(fieldId, entry.amount, val)} labels={quickAmountLabels} />
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
  const quickAmountLabels = [
    t.input.quickAdd1Man,
    t.input.quickAdd10Man,
    t.input.quickAdd100Man,
    t.input.quickAdd1000Man,
    t.input.quickAdd1Eok,
  ];
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

  const handleAddAmount = useCallback(
    (field: string, currentAmount: number, addValue: number) => {
      const newAmount = currentAmount + addValue;
      setRollingAmount(field, newAmount);
      if (focusedField === field) setLocalValue(newAmount.toString());
    },
    [focusedField, setRollingAmount]
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
            quickAmountLabels={quickAmountLabels}
            focusedField={focusedField}
            localValue={localValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            onAddAmount={handleAddAmount}
          />
        ))}

        {rollings.length < 3 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-dashed border-brand-gold/30 text-brand-gold/80 transition-all hover:border-brand-gold/50 hover:bg-brand-gold/5 hover:text-brand-gold"
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
