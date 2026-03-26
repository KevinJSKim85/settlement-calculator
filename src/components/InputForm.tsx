'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { useSettlementStore, RollingEntry } from '@/lib/store';
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
      <SelectTrigger size="sm" className="w-[100px] shrink-0 border-border/60 bg-secondary text-secondary-foreground">
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
          className="border-brand-gold/20 text-brand-gold/70 hover:bg-brand-gold/10 hover:text-brand-gold"
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
  value,
  currency,
  quickAmountLabels,
  onValueChange,
  onCurrencyChange,
  onAddAmount,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  currency: Currency;
  quickAmountLabels: string[];
  onValueChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onAddAmount: (amount: number) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-1.5 sm:grid sm:items-center sm:gap-3" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
        <span className="text-sm font-medium text-brand-gold/80">{label}</span>
        <div className="flex items-center gap-2 sm:contents">
          <CurrencySelect value={currency} onValueChange={onCurrencyChange} />
          <Input
            type="text"
            inputMode="decimal"
            className="flex-1 border-border/60 bg-secondary text-right tabular-nums text-foreground focus-visible:ring-2 focus-visible:ring-brand-red/60"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="0"
          />
        </div>
      </div>
      <div className="sm:ml-3 sm:pl-[120px]">
        <QuickAmountButtons onAdd={onAddAmount} labels={quickAmountLabels} />
      </div>
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

  const handleFeeAmountChange = (value: string) => {
    setLocalFeeAmount(value);
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-surface px-3 py-2.5 sm:grid sm:items-center sm:gap-3" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
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
            className="h-6 w-16 border-brand-gold/30 bg-secondary px-1.5 text-center text-xs tabular-nums text-brand-gold focus-visible:ring-1 focus-visible:ring-brand-red/60"
          />
          <span className="text-xs text-muted-foreground/60">%</span>
        </span>
      </span>
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-sm text-muted-foreground">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          className="h-7 w-32 border-border/40 bg-transparent text-right text-sm tabular-nums font-medium text-brand-red focus-visible:ring-1 focus-visible:ring-brand-red/60 sm:ml-auto"
          value={editingAmount ? localFeeAmount : displayAmount}
          onFocus={handleFeeAmountFocus}
          onBlur={handleFeeAmountBlur}
          onChange={(e) => handleFeeAmountChange(e.target.value)}
          placeholder="0"
        />
      </div>
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
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-surface px-3 py-2.5 sm:grid sm:items-center sm:gap-3" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
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
          className={`text-right text-sm tabular-nums font-medium ${
            isNegative ? 'text-brand-red' : 'text-foreground'
          }`}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}

function RollingSection({
  entry,
  index,
  total,
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
  quickAmountLabels: string[];
  focusedField: string | null;
  localValue: string;
  onFocus: (id: string, amount: number) => void;
  onBlur: () => void;
  onChange: (id: string, value: string) => void;
  onAddAmount: (id: string, currentAmount: number, addValue: number) => void;
}) {
  const { t } = useTranslation();
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const removeRolling = useSettlementStore((s) => s.removeRolling);
  const setRollingCurrency = useSettlementStore((s) => s.setRollingCurrency);
  const setRollingFeePercent = useSettlementStore((s) => s.setRollingFeePercent);
  const setRollingTarget = useSettlementStore((s) => s.setRollingTarget);

  const revenueBPercent = 100 - revenueAPercent;

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
    <div className="space-y-2 rounded-lg border border-brand-gold/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={entry.target === 'A' ? 'default' : 'outline'}
            size="xs"
            className={entry.target === 'A'
              ? 'bg-brand-red text-white hover:bg-brand-red/80 text-xs h-5 px-1.5'
              : 'border-border/60 text-muted-foreground/60 text-xs h-5 px-1.5 hover:text-foreground'}
            onClick={() => setRollingTarget(entry.id, 'A')}
          >
            {t.input.targetA} {revenueAPercent}%
          </Button>
          <Button
            type="button"
            variant={entry.target === 'B' ? 'default' : 'outline'}
            size="xs"
            className={entry.target === 'B'
              ? 'bg-brand-red text-white hover:bg-brand-red/80 text-xs h-5 px-1.5'
              : 'border-border/60 text-muted-foreground/60 text-xs h-5 px-1.5 hover:text-foreground'}
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
            className="text-muted-foreground/40 hover:text-brand-red"
            onClick={() => removeRolling(entry.id)}
          >
            ✕
          </Button>
        )}
      </div>

      <InputRow
        label={rollingLabel}
        value={displayValue}
        currency={entry.currency}
        quickAmountLabels={quickAmountLabels}
        onValueChange={(v) => onChange(fieldId, v)}
        onCurrencyChange={(c) => setRollingCurrency(entry.id, c)}
        onAddAmount={(val) => onAddAmount(fieldId, entry.amount, val)}
        onFocus={() => onFocus(fieldId, entry.amount)}
        onBlur={onBlur}
      />

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

export function InputForm() {
  const { t } = useTranslation();
  const quickAmountLabels = [
    t.input.quickAdd1Man,
    t.input.quickAdd10Man,
    t.input.quickAdd100Man,
    t.input.quickAdd1000Man,
    t.input.quickAdd1Eok,
  ];
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rollings = useSettlementStore((s) => s.rollings);
  const setBuying = useSettlementStore((s) => s.setBuying);
  const setBuyingCurrency = useSettlementStore((s) => s.setBuyingCurrency);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setReturningCurrency = useSettlementStore((s) => s.setReturningCurrency);
  const setRollingAmount = useSettlementStore((s) => s.setRollingAmount);
  const addRolling = useSettlementStore((s) => s.addRolling);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState('');

  const balance = buying.amount - returning.amount;

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
      else setRollingAmount(field, parsed);
    },
    [setBuying, setReturning, setRollingAmount]
  );

  const handleAddAmount = useCallback(
    (field: string, currentAmount: number, addValue: number) => {
      const newAmount = currentAmount + addValue;
      if (field === 'buying') setBuying(newAmount);
      else if (field === 'returning') setReturning(newAmount);
      else setRollingAmount(field, newAmount);
      if (focusedField === field) setLocalValue(newAmount.toString());
    },
    [focusedField, setBuying, setReturning, setRollingAmount]
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
    <Card className="border-border/60 bg-card">
      <CardHeader>
        <CardTitle className="text-brand-gold">{t.app.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InputRow
          label={t.input.buying}
          value={getDisplayValue('buying', buying.amount, buying.currency)}
          currency={buying.currency}
          quickAmountLabels={quickAmountLabels}
          onValueChange={(v) => handleChange('buying', v)}
          onCurrencyChange={setBuyingCurrency}
          onAddAmount={(val) => handleAddAmount('buying', buying.amount, val)}
          onFocus={() => handleFocus('buying', buying.amount)}
          onBlur={handleBlur}
        />

        <InputRow
          label={t.input.returning}
          value={getDisplayValue('returning', returning.amount, returning.currency)}
          currency={returning.currency}
          quickAmountLabels={quickAmountLabels}
          onValueChange={(v) => handleChange('returning', v)}
          onCurrencyChange={setReturningCurrency}
          onAddAmount={(val) => handleAddAmount('returning', returning.amount, val)}
          onFocus={() => handleFocus('returning', returning.amount)}
          onBlur={handleBlur}
        />

        <ComputedRow
          label={t.input.balance}
          value={balance}
          currency={returning.currency}
          isNegative={balance < 0}
        />

        {rollings.map((entry, index) => (
          <RollingSection
            key={entry.id}
            entry={entry}
            index={index}
            total={rollings.length}
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
            className="w-full border-brand-gold/20 text-brand-gold/60 hover:bg-brand-gold/10 hover:text-brand-gold"
            onClick={addRolling}
          >
            {t.input.addRolling}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
