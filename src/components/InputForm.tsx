'use client';

import { useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type FieldKey = 'buying' | 'returning' | 'rollingA' | 'rollingB';

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

function ComputedRow({
  label,
  value,
  currency,
  isNegative,
  badge,
  feePercent,
  onFeePercentChange,
}: {
  label: string;
  value: number;
  currency: Currency;
  isNegative?: boolean;
  badge?: string;
  feePercent?: number;
  onFeePercentChange?: (percent: number) => void;
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
        {badge && !feePercent && (
          <Badge variant="secondary" className="border-brand-gold/20 bg-brand-gold/10 text-brand-gold text-[10px]">
            {badge}
          </Badge>
        )}
        {feePercent !== undefined && onFeePercentChange && (
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
            <span className="text-[10px] text-muted-foreground/60">%</span>
          </span>
        )}
        {isNegative && (
          <span className="text-[10px] font-semibold text-brand-red">({t.result.loss})</span>
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
  const rollingA = useSettlementStore((s) => s.rollingA);
  const rollingB = useSettlementStore((s) => s.rollingB);
  const rollingFeePercentA = useSettlementStore((s) => s.rollingFeePercentA);
  const rollingFeePercentB = useSettlementStore((s) => s.rollingFeePercentB);

  const setBuying = useSettlementStore((s) => s.setBuying);
  const setBuyingCurrency = useSettlementStore((s) => s.setBuyingCurrency);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setReturningCurrency = useSettlementStore((s) => s.setReturningCurrency);
  const setRollingA = useSettlementStore((s) => s.setRollingA);
  const setRollingACurrency = useSettlementStore((s) => s.setRollingACurrency);
  const setRollingB = useSettlementStore((s) => s.setRollingB);
  const setRollingBCurrency = useSettlementStore((s) => s.setRollingBCurrency);
  const setRollingFeePercentA = useSettlementStore((s) => s.setRollingFeePercentA);
  const setRollingFeePercentB = useSettlementStore((s) => s.setRollingFeePercentB);

  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [localValue, setLocalValue] = useState('');

  const balance = buying.amount - returning.amount;
  const rollingFeeA = (rollingA.amount * rollingFeePercentA) / 100;
  const rollingFeeB = (rollingB.amount * rollingFeePercentB) / 100;

  const handleFocus = useCallback((field: FieldKey, amount: number) => {
    setFocusedField(field);
    setLocalValue(amount === 0 ? '' : amount.toString());
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
    setLocalValue('');
  }, []);

  const handleChange = useCallback(
    (field: FieldKey, value: string) => {
      setLocalValue(value);
      const parsed = parseFormattedNumber(value);
      switch (field) {
        case 'buying':
          setBuying(parsed);
          break;
        case 'returning':
          setReturning(parsed);
          break;
        case 'rollingA':
          setRollingA(parsed);
          break;
        case 'rollingB':
          setRollingB(parsed);
          break;
      }
    },
    [setBuying, setReturning, setRollingA, setRollingB]
  );

  const handleAddAmount = useCallback(
    (field: FieldKey, currentAmount: number, addValue: number) => {
      const newAmount = currentAmount + addValue;
      switch (field) {
        case 'buying':
          setBuying(newAmount);
          break;
        case 'returning':
          setReturning(newAmount);
          break;
        case 'rollingA':
          setRollingA(newAmount);
          break;
        case 'rollingB':
          setRollingB(newAmount);
          break;
      }
      if (focusedField === field) {
        setLocalValue(newAmount.toString());
      }
    },
    [focusedField, setBuying, setReturning, setRollingA, setRollingB]
  );

  const getDisplayValue = useCallback(
    (field: FieldKey, amount: number, currency: Currency) => {
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

        <div className="space-y-2 rounded-lg border border-brand-gold/10 p-3">
          <InputRow
            label={t.input.rollingA}
            value={getDisplayValue('rollingA', rollingA.amount, rollingA.currency)}
            currency={rollingA.currency}
            quickAmountLabels={quickAmountLabels}
            onValueChange={(v) => handleChange('rollingA', v)}
            onCurrencyChange={setRollingACurrency}
            onAddAmount={(val) => handleAddAmount('rollingA', rollingA.amount, val)}
            onFocus={() => handleFocus('rollingA', rollingA.amount)}
            onBlur={handleBlur}
          />
          <ComputedRow
            label={t.input.rollingFeeA}
            value={rollingFeeA}
            currency={rollingA.currency}
            feePercent={rollingFeePercentA}
            onFeePercentChange={setRollingFeePercentA}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-brand-gold/10 p-3">
          <InputRow
            label={t.input.rollingB}
            value={getDisplayValue('rollingB', rollingB.amount, rollingB.currency)}
            currency={rollingB.currency}
            quickAmountLabels={quickAmountLabels}
            onValueChange={(v) => handleChange('rollingB', v)}
            onCurrencyChange={setRollingBCurrency}
            onAddAmount={(val) => handleAddAmount('rollingB', rollingB.amount, val)}
            onFocus={() => handleFocus('rollingB', rollingB.amount)}
            onBlur={handleBlur}
          />
          <ComputedRow
            label={t.input.rollingFeeB}
            value={rollingFeeB}
            currency={rollingB.currency}
            feePercent={rollingFeePercentB}
            onFeePercentChange={setRollingFeePercentB}
          />
        </div>
      </CardContent>
    </Card>
  );
}
