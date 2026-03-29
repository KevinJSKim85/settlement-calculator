'use client';

import React from 'react';
import { FileText } from 'lucide-react';
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
    <div className="mt-0.5 text-xs font-normal text-muted-foreground/40">
      {converted.map((c, i) => (
        <React.Fragment key={c.currency}>
          {i > 0 && <span className="mx-1 text-muted-foreground/20">|</span>}
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
          bold ? 'text-base font-bold' : 'font-medium',
          isNegative ? 'text-brand-red' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatCurrency(safeAmount, baseCurrency)}
        {isNegative && <span className="ml-1 text-xs text-brand-red/70">({t.result.loss})</span>}
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
        bold ? 'font-bold text-brand-gold' : 'text-muted-foreground/40',
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
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40 bg-card/50 p-12 text-center backdrop-blur-sm"
        >
          <FileText className="size-8 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground/40">{t.app.subtitle}</p>
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
        className="fade-in premium-card overflow-hidden rounded-xl border border-border/40 bg-card"
      >
        <div className="overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-surface/50">
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
                {t.result.item}
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
                {t.result.amount} ({baseCurrency})
              </th>
              <th className="w-20 px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/50">
                {t.result.ratio}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap px-3 py-3 text-foreground/70">{t.input.balance}</td>
              <AmountCell
                amount={result.balance}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell />
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.buyingA}</td>
              <AmountCell
                amount={result.buyingA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.buyingB}</td>
              <AmountCell
                amount={result.buyingB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.returningA}</td>
              <AmountCell
                amount={result.returningA > 0 ? -result.returningA : result.returningA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                forceNegativeStyle={result.returningA > 0}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.returningB}</td>
              <AmountCell
                amount={result.returningB > 0 ? -result.returningB : result.returningB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                forceNegativeStyle={result.returningB > 0}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            {result.rollingFees.map((rf) => (
              <tr key={rf.label} className="border-b border-border/20 transition-colors hover:bg-surface/30">
                <td className="whitespace-nowrap px-3 py-3 text-foreground/70">
                  {rollingFeeLabel(rf.label)}
                  <span className="ml-1.5 text-xs text-muted-foreground/30">
                    {rf.target}
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

            {/* Revenue total - accent bar */}
            <tr className="accent-bar-red border-b border-border/40 bg-brand-red/5">
              <td className="whitespace-nowrap px-3 py-3.5 font-semibold text-foreground">
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

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.revenueA}</td>
              <AmountCell
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{t.result.revenueB}</td>
              <AmountCell
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            {/* Distribution total - accent bar */}
            <tr className="accent-bar-gold border-b border-border/40 bg-brand-gold/5">
              <td className="whitespace-nowrap px-3 py-3.5 font-semibold text-foreground">
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
                className={`transition-colors hover:bg-surface/30 ${
                  idx < result.distribution.length - 1
                    ? 'border-b border-border/20'
                    : ''
                }`}
              >
                <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/60">{dist.memberName}</td>
                <AmountCell
                  amount={dist.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                />
                <NoteCell>
                  <div>{dist.percentage}%</div>
                  {dist.overallPercent > 0 && (
                    <div className="text-xs text-muted-foreground/30">
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
