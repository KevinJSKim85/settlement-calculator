'use client';

import React from 'react';
import { useTranslation } from '@/i18n';
import type { Currency, ExchangeRates, SettlementResult } from '@/types';
import { CURRENCIES } from '@/types';
import { convertAmount, formatCurrency } from '@/lib/currency';

interface ResultsDisplayProps {
  result: SettlementResult | null;
  exchangeRates?: ExchangeRates;
  baseCurrency: Currency;
  revenueAPercent: number;
}

function MultiCurrencyLine({
  amount,
  baseCurrency,
  exchangeRates,
}: {
  amount: number;
  baseCurrency: Currency;
  exchangeRates?: ExchangeRates;
}) {
  if (!exchangeRates) return null;

  const otherCurrencies = CURRENCIES.filter(
    (c) => c !== baseCurrency && exchangeRates[c] !== undefined
  );

  if (otherCurrencies.length === 0) return null;

  const converted = otherCurrencies.map((c) => ({
    currency: c,
    formatted: formatCurrency(
      convertAmount(amount, baseCurrency, c, exchangeRates, baseCurrency),
      c
    ),
  }));

  return (
    <div className="mt-0.5 text-xs font-normal text-muted-foreground/60">
      {converted.map((c, i) => (
        <React.Fragment key={c.currency}>
          {i > 0 && <span className="mx-1 text-muted-foreground/30">|</span>}
          <span>{c.formatted}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function AmountCell({
  amount,
  baseCurrency,
  exchangeRates,
  bold = false,
  forceNegativeStyle = false,
}: {
  amount: number;
  baseCurrency: Currency;
  exchangeRates?: ExchangeRates;
  bold?: boolean;
  forceNegativeStyle?: boolean;
}) {
  const { t } = useTranslation();
  const isNegative = amount < 0 || forceNegativeStyle;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    <td className="whitespace-nowrap px-3 py-3 text-right align-top">
      <div
        className={[
          bold ? 'font-semibold' : 'font-medium',
          isNegative ? 'text-brand-red' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatCurrency(safeAmount, baseCurrency)}
        {isNegative && <span className="ml-1 text-xs text-brand-red">({t.result.loss})</span>}
      </div>
      <MultiCurrencyLine
        amount={safeAmount}
        baseCurrency={baseCurrency}
        exchangeRates={exchangeRates}
      />
    </td>
  );
}

function NoteCell({
  children,
  bold = false,
}: {
  children?: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <td
      className={[
        'px-3 py-3 text-right text-sm tabular-nums',
        bold ? 'font-semibold text-brand-gold' : 'text-muted-foreground/60',
      ].join(' ')}
    >
      {children}
    </td>
  );
}

const ResultsDisplay = React.forwardRef<HTMLDivElement, ResultsDisplayProps>(
  function ResultsDisplay(
    { result, exchangeRates, baseCurrency, revenueAPercent },
    ref
  ) {
    const { t } = useTranslation();

    if (!result) {
      return (
        <div
          ref={ref}
          className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground"
        >
          {t.app.subtitle}
        </div>
      );
    }

    const revenueBPercent = 100 - revenueAPercent;
    const distributionTotal = result.distribution.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    const rollingFeeLabel = (label: string) =>
      result.rollingFees.length > 1
        ? `${t.input.rollingFee} ${label}`
        : t.input.rollingFee;

    return (
      <div
        ref={ref}
        className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg shadow-black/20"
      >
        <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-surface">
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-gold/70">
                {t.result.item}
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-brand-gold/70">
                {t.result.amount} ({baseCurrency})
              </th>
              <th className="w-20 px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-brand-gold/70">
                {t.result.ratio}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="whitespace-nowrap px-3 py-3 text-foreground/80">{t.input.balance}</td>
              <AmountCell
                amount={result.balance}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell />
            </tr>

            {result.rollingFees.map((rf) => (
              <tr key={rf.label} className="border-b border-border/40">
                <td className="whitespace-nowrap px-3 py-3 text-foreground/80">
                  {rollingFeeLabel(rf.label)}
                  <span className="ml-1.5 text-xs text-muted-foreground/40">
                    →{rf.target}
                  </span>
                </td>
                <AmountCell
                  amount={rf.amount > 0 ? -rf.amount : rf.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                  forceNegativeStyle
                />
                <NoteCell>{rf.feePercent}%</NoteCell>
              </tr>
            ))}

            <tr className="border-b border-border/60 bg-brand-red/10">
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-brand-gold">
                {t.result.revenue}
              </td>
              <AmountCell
                amount={result.totalRevenue}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                bold
              />
              <NoteCell bold>100%</NoteCell>
            </tr>

            <tr className="border-b border-border/40">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.revenueA}</td>
              <AmountCell
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/40">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.revenueB}</td>
              <AmountCell
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/60 bg-brand-gold/10">
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-brand-gold">
                {t.result.distribution}
              </td>
              <AmountCell
                amount={distributionTotal}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                bold
              />
              <NoteCell bold />
            </tr>

            {result.distribution.map((dist, idx) => (
              <tr
                key={dist.memberId}
                className={
                  idx < result.distribution.length - 1
                    ? 'border-b border-border/40'
                    : ''
                }
              >
                <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{dist.memberName}</td>
                <AmountCell
                  amount={dist.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                />
                <NoteCell>
                  <div>{dist.percentage}%</div>
                  {dist.overallPercent > 0 && (
                    <div className="text-xs text-muted-foreground/40">
                      {dist.overallPercent}% {t.result.withinB}
                    </div>
                  )}
                </NoteCell>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    );
  }
);

ResultsDisplay.displayName = 'ResultsDisplay';

export default ResultsDisplay;
