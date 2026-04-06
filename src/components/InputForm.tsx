'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, RotateCcw, Scale, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
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

function InputRow({
  label,
  icon,
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  onFocus,
  onBlur,
  topExtra,
  footer,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  currency: Currency;
  onValueChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
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

  const displayAmount = feeAmount > 0 ? `-${formatNumber(feeAmount, 0)}` : formatNumber(0, 0);

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
  const formatted = formatNumber(Math.abs(value), 0);
  const sign = value < 0 ? '-' : '';
  const displayValue = `${sign}${formatted}`;

  return (
    <div className={`flex flex-col gap-1 rounded-xl px-4 py-3 sm:grid sm:items-center sm:gap-3 ${isNegative ? 'bg-brand-red/5 border border-brand-red/10' : 'bg-brand-gold/5 border border-brand-gold/10'}`} style={{ gridTemplateColumns: '120px 100px 1fr' }}>
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Scale className="size-4 text-muted-foreground" />
        {label}
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
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
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
    return formatNumber(entry.amount, 0);
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

      <InputRow
        label={rollingLabel}
        icon={<RotateCcw className="size-4" />}
        value={displayValue}
        currency={entry.currency}
        onValueChange={(v) => onChange(fieldId, v)}
        onCurrencyChange={(c) => setRollingCurrency(entry.id, c)}
        onFocus={() => onFocus(fieldId, entry.amount)}
        onBlur={onBlur}
        footer={entry.currency !== 'KRW' && (manualExchangeRates[entry.currency] ?? 0) > 0 && entry.amount > 0 ? (
          <div className="text-right text-xs text-muted-foreground">
            → KRW ₩ {formatNumber(Math.round(entry.amount * (manualExchangeRates[entry.currency] ?? 0)), 0)}
          </div>
        ) : undefined}
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
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rollings = useSettlementStore((s) => s.rollings);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const splitMode = useSettlementStore((s) => s.splitMode);
  const storeBuyingA = useSettlementStore((s) => s.buyingA);
  const storeBuyingB = useSettlementStore((s) => s.buyingB);
  const storeReturningA = useSettlementStore((s) => s.returningA);
  const storeReturningB = useSettlementStore((s) => s.returningB);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const autoRevenueSplitFromRate = useSettlementStore((s) => s.autoRevenueSplitFromRate);
  const setBuying = useSettlementStore((s) => s.setBuying);
  const setBuyingCurrency = useSettlementStore((s) => s.setBuyingCurrency);
  const setReturning = useSettlementStore((s) => s.setReturning);
  const setReturningCurrency = useSettlementStore((s) => s.setReturningCurrency);
  const setManualExchangeRate = useSettlementStore((s) => s.setManualExchangeRate);
  const setRollingAmount = useSettlementStore((s) => s.setRollingAmount);
  const addRolling = useSettlementStore((s) => s.addRolling);
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

  const buyingRate = manualExchangeRates[buying.currency] ?? 0;
  const effectiveRevenueAPercent = autoRevenueSplitFromRate && buying.currency !== 'KRW' && buyingRate > 0
    ? deriveRevenueAPercentFromRate(buyingRate)
    : revenueAPercent;
  const effectiveRevenueBPercent = Math.round((100 - effectiveRevenueAPercent) * 100) / 100;
  const buyingKrwAmount = buying.currency === 'KRW'
    ? buying.amount
    : Math.round(buying.amount * buyingRate);

  const balance = isManual
    ? (storeBuyingA + storeBuyingB) - (storeReturningA + storeReturningB)
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
      else setRollingAmount(field, parsed);
    },
    [setBuying, setReturning, setRollingAmount, setSBuyingA, setSBuyingB, setSReturningA, setSReturningB]
  );

  const getDisplayValue = useCallback(
    (field: string, amount: number) => {
      if (focusedField === field) return localValue;
      if (amount === 0) return '';
      return formatNumber(amount, 0);
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
            <Input
              type="text"
              className="h-8 border-border/40 bg-surface text-foreground focus-glow"
              value={userInfo.code}
              onChange={(e) => setUserInfo('code', e.target.value)}
              placeholder={t.header.code}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.name}</label>
            <Input
              type="text"
              className="h-8 border-border/40 bg-surface text-foreground focus-glow"
              value={userInfo.name}
              onChange={(e) => setUserInfo('name', e.target.value)}
              placeholder={t.header.name}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.date}</label>
            <Input
              type="text"
              className="h-8 border-border/40 bg-surface text-foreground focus-glow"
              value={userInfo.date}
              onChange={(e) => setUserInfo('date', e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{t.header.location}</label>
            <Input
              type="text"
              className="h-8 border-border/40 bg-surface text-foreground focus-glow"
              value={userInfo.location}
              onChange={(e) => setUserInfo('location', e.target.value)}
              placeholder={t.header.location}
            />
          </div>
        </div>

        <div className="border-t border-border/20" />

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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><ShoppingCart className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.buying}</span>
                <CurrencySelect value={buying.currency} onValueChange={setBuyingCurrency} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-red">A</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingA', storeBuyingA)}
                    onChange={(e) => handleChange('buyingA', e.target.value)}
                    onFocus={() => handleFocus('buyingA', storeBuyingA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-gold">B</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('buyingB', storeBuyingB)}
                    onChange={(e) => handleChange('buyingB', e.target.value)}
                    onFocus={() => handleFocus('buyingB', storeBuyingB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/20" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><RotateCcw className="size-4" /></span>
                <span className="text-sm font-medium text-foreground">{t.input.returning}</span>
                <CurrencySelect value={returning.currency} onValueChange={setReturningCurrency} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-red">A</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningA', storeReturningA)}
                    onChange={(e) => handleChange('returningA', e.target.value)}
                    onFocus={() => handleFocus('returningA', storeReturningA)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-brand-gold">B</span>
                  <Input
                    type="text" inputMode="decimal"
                    className="border-border/40 bg-surface text-right tabular-nums text-foreground focus-glow"
                    value={getDisplayValue('returningB', storeReturningB)}
                    onChange={(e) => handleChange('returningB', e.target.value)}
                    onFocus={() => handleFocus('returningB', storeReturningB)}
                    onBlur={handleBlur}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {buying.currency !== 'KRW' ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground"><ShoppingCart className="size-4" /></span>
                    <span className="text-sm font-medium text-foreground">{t.input.buying}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-[20rem]">
                    <div className="rounded-xl border border-border/40 bg-surface px-3 py-2">
                      <div className="mb-1 text-[11px] text-muted-foreground">{t.input.fxRate}</div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={buyingRate > 0 ? String(buyingRate) : ''}
                        onChange={(e) => setManualExchangeRate(buying.currency, parseFormattedNumber(e.target.value))}
                        className="h-6 border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                        placeholder="0"
                      />
                    </div>
                    <div className="rounded-xl border border-border/40 bg-surface px-3 py-2">
                      <div className="mb-1 text-[11px] text-muted-foreground">{t.input.foreignAmount}</div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={getDisplayValue('buying', buying.amount)}
                        onChange={(e) => handleChange('buying', e.target.value)}
                        onFocus={() => handleFocus('buying', buying.amount)}
                        onBlur={handleBlur}
                        className="h-6 border-0 bg-transparent px-0 text-right text-sm tabular-nums shadow-none focus-visible:ring-0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CurrencySelect value={buying.currency} onValueChange={setBuyingCurrency} />
                  <Input
                    type="text"
                    readOnly
                    className="flex-1 border-border/40 bg-surface text-right tabular-nums text-foreground focus-visible:ring-0"
                    value={buyingKrwAmount === 0 ? '' : formatNumber(buyingKrwAmount, 0)}
                    placeholder={t.input.krwAmount}
                  />
                </div>
              </div>
            ) : (
              <InputRow
                label={t.input.buying}
                icon={<ShoppingCart className="size-4" />}
                value={getDisplayValue('buying', buying.amount)}
                currency={buying.currency}
                onValueChange={(v) => handleChange('buying', v)}
                onCurrencyChange={setBuyingCurrency}
                onFocus={() => handleFocus('buying', buying.amount)}
                onBlur={handleBlur}
              />
            )}

            <div className="border-t border-border/20" />

            <InputRow
              label={t.input.returning}
              icon={<RotateCcw className="size-4" />}
              value={getDisplayValue('returning', returning.amount)}
              currency={returning.currency}
              onValueChange={(v) => handleChange('returning', v)}
              onCurrencyChange={setReturningCurrency}
              onFocus={() => handleFocus('returning', returning.amount)}
              onBlur={handleBlur}
              footer={returning.currency !== 'KRW' && (manualExchangeRates[returning.currency] ?? 0) > 0 && returning.amount > 0 ? (
                <div className="text-right text-xs text-muted-foreground">
                  → KRW ₩ {formatNumber(Math.round(returning.amount * (manualExchangeRates[returning.currency] ?? 0)), 0)}
                </div>
              ) : undefined}
            />
          </>
        )}

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
