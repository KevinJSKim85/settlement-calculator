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
    <div className="mt-0.5 text-xs font-normal text-muted-foreground">
      {converted.map((c, i) => (
        <React.Fragment key={c.currency}>
          {i > 0 && <span className="mx-1 text-muted-foreground/60">|</span>}
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
        bold ? 'font-bold text-brand-gold' : 'text-muted-foreground',
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
          className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/40 bg-card/50 p-16 text-center backdrop-blur-sm"
        >
          <FileText className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t.app.subtitle}</p>
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
            <tr className="border-b border-border/40 bg-surface/70">
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.result.item}
              </th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.result.amount} ({baseCurrency})
              </th>
              <th className="w-20 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.result.ratio}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap px-3 py-3 text-foreground">{t.input.balance}</td>
              <AmountCell
                amount={result.balance}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell />
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.input.targetA} {t.input.balance}</td>
              <AmountCell
                amount={result.balanceA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.input.targetB} {t.input.balance}</td>
              <AmountCell
                amount={result.balanceB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.buyingA}</td>
              <AmountCell
                amount={result.buyingA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.buyingB}</td>
              <AmountCell
                amount={result.buyingB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.returningA}</td>
              <AmountCell
                amount={result.returningA > 0 ? -result.returningA : result.returningA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                forceNegativeStyle={result.returningA > 0}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.returningB}</td>
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
                <td className="whitespace-nowrap px-3 py-3 text-foreground">
                  {rollingFeeLabel(rf.label)}
                  <span className="ml-1.5 text-xs text-muted-foreground/70">
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

            {/* Expenses */}
            {(result.expenseTotalA > 0 || result.expenseTotalB > 0) && (
              <>
                {result.expenses.costA + result.expenses.costB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">{t.expenses.cost}</td>
                    <AmountCell amount={-(result.expenses.costA + result.expenses.costB)} baseCurrency={baseCurrency} exchangeRates={exchangeRates} forceNegativeStyle />
                    <NoteCell><div className="text-xs">A: {formatCurrency(-result.expenses.costA, baseCurrency)}</div><div className="text-xs">B: {formatCurrency(-result.expenses.costB, baseCurrency)}</div></NoteCell>
                  </tr>
                )}
                {result.expenses.tipA + result.expenses.tipB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">{t.expenses.tip}</td>
                    <AmountCell amount={-(result.expenses.tipA + result.expenses.tipB)} baseCurrency={baseCurrency} exchangeRates={exchangeRates} forceNegativeStyle />
                    <NoteCell><div className="text-xs">A: {formatCurrency(-result.expenses.tipA, baseCurrency)}</div><div className="text-xs">B: {formatCurrency(-result.expenses.tipB, baseCurrency)}</div></NoteCell>
                  </tr>
                )}
                {result.expenses.markA + result.expenses.markB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">{t.expenses.mark}</td>
                    <AmountCell amount={-(result.expenses.markA + result.expenses.markB)} baseCurrency={baseCurrency} exchangeRates={exchangeRates} forceNegativeStyle />
                    <NoteCell><div className="text-xs">A: {formatCurrency(-result.expenses.markA, baseCurrency)}</div><div className="text-xs">B: {formatCurrency(-result.expenses.markB, baseCurrency)}</div></NoteCell>
                  </tr>
                )}
                {result.expenses.taxA + result.expenses.taxB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="whitespace-nowrap px-3 py-3 text-foreground">
                      {t.expenses.tax}
                      {result.expenses.taxPercent > 0 && <span className="ml-1.5 text-xs text-muted-foreground/70">{result.expenses.taxPercent}%</span>}
                    </td>
                    <AmountCell amount={-(result.expenses.taxA + result.expenses.taxB)} baseCurrency={baseCurrency} exchangeRates={exchangeRates} forceNegativeStyle />
                    <NoteCell><div className="text-xs">A: {formatCurrency(-result.expenses.taxA, baseCurrency)}</div><div className="text-xs">B: {formatCurrency(-result.expenses.taxB, baseCurrency)}</div></NoteCell>
                  </tr>
                )}
              </>
            )}

            {/* Revenue total - accent bar */}
            <tr className="accent-bar-red border-b border-border/40 bg-brand-red/8">
              <td className="whitespace-nowrap px-3 py-4 text-base font-bold text-foreground">
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
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.revenueA}</td>
              <AmountCell
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{t.result.revenueB}</td>
              <AmountCell
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            {/* Distribution total - accent bar */}
            <tr className="accent-bar-gold border-b border-border/40 bg-brand-gold/8">
              <td className="whitespace-nowrap px-3 py-4 text-base font-bold text-foreground">
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
                <td className="whitespace-nowrap py-3 pl-6 pr-3 text-foreground/80">{dist.memberName}</td>
                <AmountCell
                  amount={dist.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                />
                <NoteCell>
                  <div>{dist.percentage}%</div>
                  {dist.overallPercent > 0 && (
                    <div className="text-xs text-muted-foreground/70">
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
