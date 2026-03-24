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

type FieldKey = 'buying' | 'returning' | 'rolling';

function CurrencySelect({
  value,
  onValueChange,
}: {
  value: Currency;
  onValueChange: (currency: Currency) => void;
}) {
  return (
    <Select value={value} onValueChange={(val) => onValueChange(val as Currency)}>
      <SelectTrigger size="sm" className="w-[100px] shrink-0">
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

function InputRow({
  label,
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  currency: Currency;
  onValueChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:grid sm:items-center sm:gap-2" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2 sm:contents">
        <CurrencySelect value={currency} onValueChange={onCurrencyChange} />
        <Input
          type="text"
          inputMode="decimal"
          className="text-right tabular-nums flex-1 focus-visible:ring-2 focus-visible:ring-blue-500"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
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
  badge,
}: {
  label: string;
  value: number;
  currency: Currency;
  isNegative?: boolean;
  badge?: string;
}) {
  const decimals = CURRENCY_CONFIG[currency].decimals;
  const formatted = formatNumber(Math.abs(value), decimals);
  const sign = value < 0 ? '-' : '';
  const displayValue = `${sign}${formatted}`;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-stone-50 px-3 py-2 sm:grid sm:items-center sm:gap-2" style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {label}
        {badge && (
          <Badge variant="secondary" className="text-[10px]">
            {badge}
          </Badge>
        )}
        {isNegative && (
          <span className="text-[10px] text-red-500 font-semibold">(손실)</span>
        )}
      </span>
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-sm text-muted-foreground">
          {currency} {CURRENCY_CONFIG[currency].symbol}
        </span>
        <span
          className={`text-right text-sm tabular-nums font-medium ${
            isNegative ? 'text-red-500' : 'text-foreground'
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
  const rolling = useSettlementStore((s) => s.rolling);
  const rollingFeePercent = useSettlementStore((s) => s.rollingFeePercent);

  const setBuying = useSettlementStore((s) => s.setBuying);
  const setBuyingCurrency = useSettlementStore((s) => s.setBuyingCurrency);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setReturningCurrency = useSettlementStore((s) => s.setReturningCurrency);
  const setRolling = useSettlementStore((s) => s.setRolling);
  const setRollingCurrency = useSettlementStore((s) => s.setRollingCurrency);

  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [localValue, setLocalValue] = useState('');

  const balance = returning.amount - buying.amount;
  const rollingFee = (rolling.amount * rollingFeePercent) / 100;

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
        case 'rolling':
          setRolling(parsed);
          break;
      }
    },
    [setBuying, setReturning, setRolling]
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
    <Card>
      <CardHeader>
        <CardTitle>{t.app.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <InputRow
          label={t.input.buying}
          value={getDisplayValue('buying', buying.amount, buying.currency)}
          currency={buying.currency}
          onValueChange={(v) => handleChange('buying', v)}
          onCurrencyChange={setBuyingCurrency}
          onFocus={() => handleFocus('buying', buying.amount)}
          onBlur={handleBlur}
        />

        <InputRow
          label={t.input.returning}
          value={getDisplayValue('returning', returning.amount, returning.currency)}
          currency={returning.currency}
          onValueChange={(v) => handleChange('returning', v)}
          onCurrencyChange={setReturningCurrency}
          onFocus={() => handleFocus('returning', returning.amount)}
          onBlur={handleBlur}
        />

        <ComputedRow
          label={t.input.balance}
          value={balance}
          currency={returning.currency}
          isNegative={balance < 0}
        />

        <InputRow
          label={t.input.rolling}
          value={getDisplayValue('rolling', rolling.amount, rolling.currency)}
          currency={rolling.currency}
          onValueChange={(v) => handleChange('rolling', v)}
          onCurrencyChange={setRollingCurrency}
          onFocus={() => handleFocus('rolling', rolling.amount)}
          onBlur={handleBlur}
        />

        <ComputedRow
          label={t.input.rollingFee}
          value={rollingFee}
          currency={rolling.currency}
          badge={`${rollingFeePercent}%`}
        />
      </CardContent>
    </Card>
  );
}
