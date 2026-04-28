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
    <div className="mt-0.5 min-w-0 break-words text-xs font-normal leading-tight text-muted-foreground">
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
  formula,
}: {
  amount: number;
  baseCurrency: Currency;
  exchangeRates?: ExchangeRates;
  bold?: boolean;
  forceNegativeStyle?: boolean;
  formula?: string;
}) {
  const isNegative = amount < 0 || forceNegativeStyle;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    <td
      className="min-w-0 px-2 py-3 text-right align-top sm:px-3"
      title={formula}
      aria-label={formula}
    >
      <div
        className={[
          formula ? 'cursor-help' : '',
          'break-words leading-tight tabular-nums',
          bold ? 'text-sm font-bold sm:text-base' : 'text-[13px] font-medium sm:text-sm',
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

function RatioBadge({
  children,
  bold = false,
}: {
  children?: React.ReactNode;
  bold?: boolean;
}) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <span
      className={[
        'inline-flex min-w-[2.25rem] items-center justify-center whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] tabular-nums sm:min-w-[2.75rem] sm:px-2 sm:text-[11px]',
        bold
          ? 'bg-brand-gold/15 font-bold text-brand-gold ring-1 ring-inset ring-brand-gold/25'
          : 'bg-surface/70 font-medium text-muted-foreground ring-1 ring-inset ring-border/30',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function NoteCell({
  children,
  bold = false,
  useBadge = true,
}: {
  children?: React.ReactNode;
  bold?: boolean;
  useBadge?: boolean;
}) {
  const hasContent =
    children !== null && children !== undefined && children !== '';

  return (
    <td
      className={[
        'w-[4.5rem] px-2 py-3 text-right align-top text-sm tabular-nums sm:w-auto sm:px-3',
        bold ? 'font-bold text-brand-gold' : 'text-muted-foreground',
      ].join(' ')}
    >
      {useBadge && hasContent ? (
        <RatioBadge bold={bold}>{children}</RatioBadge>
      ) : (
        children
      )}
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
    const feeForA = result.rollingFees
      .filter((rf) => rf.target === 'A')
      .reduce((sum, rf) => sum + rf.amount, 0);
    const feeForB = result.rollingFees
      .filter((rf) => rf.target === 'B')
      .reduce((sum, rf) => sum + rf.amount, 0);
    const formulaText = (formula: string, values?: string) =>
      values
        ? `${t.formula.label}: ${formula}\n${t.formula.values}: ${values}`
        : `${t.formula.label}: ${formula}`;
    const money = (amount: number) => formatCurrency(amount, baseCurrency);
    const ratio = (value: number) => `${value.toFixed(2)}%`;
    const totalBuying = result.buyingA + result.buyingB;
    const totalReturning = result.returningA + result.returningB;
    const outflow = (amount: number) => (amount > 0 ? -amount : amount);
    const splitFormula = (
      autoFormula: string,
      autoValues: string,
      directValue: number
    ) =>
      result.splitMode === 'manual'
        ? formulaText(t.formula.directInput, money(directValue))
        : formulaText(autoFormula, autoValues);
    const revenueBFormula = result.applyFxRevenueBShare
      ? t.formula.revenueBShared
      : t.formula.revenueB;
    const revenueBValues = result.applyFxRevenueBShare
      ? `${money(result.balanceB)} × ${ratio(revenueBPercent)} - ${money(feeForB)} - ${money(result.expenseTotalB)} = ${money(result.revenueB)}`
      : `${money(result.balanceB)} - ${money(feeForB)} - ${money(result.expenseTotalB)} = ${money(result.revenueB)}`;
    const memberDistributionFormula = (
      memberPercentage: number,
      amount: number
    ) =>
      revenueBPercent <= 0
        ? formulaText(t.formula.memberDistributionZero, money(amount))
        : formulaText(
            t.formula.memberDistribution,
            `${money(result.revenueB)} × ${memberPercentage.toFixed(1)}% ÷ ${ratio(revenueBPercent)} = ${money(amount)}`
          );
    const expenseFormula = (label: string, amountA: number, amountB: number) =>
      formulaText(
        label,
        `${money(-amountA)} + ${money(-amountB)} = ${money(-(amountA + amountB))}`
      );

    return (
      <div
        ref={ref}
        className="fade-in premium-card overflow-hidden rounded-xl border border-border/40 bg-card"
      >
        <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-border/40 bg-surface/70">
              <th className="w-[45%] px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-3 sm:py-3.5">
                {t.result.item}
              </th>
              <th className="w-[35%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-3 sm:py-3.5">
                {t.result.amount} ({baseCurrency})
              </th>
              <th className="w-[20%] px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-3 sm:py-3.5">
                {t.result.ratio}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">{t.input.balance}</td>
              <AmountCell
                amount={result.balance}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={formulaText(
                  t.formula.balance,
                  `${money(result.balanceA)} + ${money(result.balanceB)} = ${money(result.balance)}`
                )}
              />
              <NoteCell />
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.input.targetA} {t.input.balance}</td>
              <AmountCell
                amount={result.balanceA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={formulaText(
                  t.formula.balanceA,
                  `${money(result.buyingA)} - ${money(result.returningA)} = ${money(result.balanceA)}`
                )}
              />
              <NoteCell>{revenueAPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.input.targetB} {t.input.balance}</td>
              <AmountCell
                amount={result.balanceB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={formulaText(
                  t.formula.balanceB,
                  `${money(result.balance)} - ${money(result.balanceA)} = ${money(result.balanceB)}`
                )}
              />
              <NoteCell>{revenueBPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.buyingA}</td>
              <AmountCell
                amount={result.buyingA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={splitFormula(
                  t.formula.buyingA,
                  `${money(totalBuying)} × ${ratio(revenueAPercent)} = ${money(result.buyingA)}`,
                  result.buyingA
                )}
              />
              <NoteCell>{revenueAPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.buyingB}</td>
              <AmountCell
                amount={result.buyingB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={splitFormula(
                  t.formula.buyingB,
                  `${money(totalBuying)} - ${money(result.buyingA)} = ${money(result.buyingB)}`,
                  result.buyingB
                )}
              />
              <NoteCell>{revenueBPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.returningA}</td>
              <AmountCell
                amount={result.returningA > 0 ? -result.returningA : result.returningA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                forceNegativeStyle={result.returningA > 0}
                formula={splitFormula(
                  t.formula.returningADisplay,
                  `-(${money(totalReturning)} × ${ratio(revenueAPercent)}) = ${money(outflow(result.returningA))}`,
                  outflow(result.returningA)
                )}
              />
              <NoteCell>{revenueAPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.returningB}</td>
              <AmountCell
                amount={result.returningB > 0 ? -result.returningB : result.returningB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                forceNegativeStyle={result.returningB > 0}
                formula={splitFormula(
                  t.formula.returningBDisplay,
                  `-(${money(totalReturning)} - ${money(result.returningA)}) = ${money(outflow(result.returningB))}`,
                  outflow(result.returningB)
                )}
              />
              <NoteCell>{revenueBPercent.toFixed(2)}%</NoteCell>
            </tr>

            {result.rollingFees.map((rf) => (
              <tr key={rf.label} className="border-b border-border/20 transition-colors hover:bg-surface/30">
                <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">
                  <span className="block truncate">{rollingFeeLabel(rf.label)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground/70 sm:text-xs">
                    {rf.target}
                  </span>
                </td>
                <AmountCell
                  amount={rf.amount > 0 ? -rf.amount : rf.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                  forceNegativeStyle
                  formula={formulaText(
                    t.formula.rollingFee,
                    `${money(rf.sourceAmount)} × ${rf.feePercent}% = ${money(-rf.amount)}`
                  )}
                />
                <NoteCell>{rf.feePercent}%</NoteCell>
              </tr>
            ))}

            {/* Expenses */}
            {(result.expenseTotalA > 0 || result.expenseTotalB > 0) && (
              <>
                {result.expenses.costA + result.expenses.costB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">{t.expenses.cost}</td>
                    <AmountCell
                      amount={-(result.expenses.costA + result.expenses.costB)}
                      baseCurrency={baseCurrency}
                      exchangeRates={exchangeRates}
                      forceNegativeStyle
                      formula={expenseFormula(
                        t.expenses.cost,
                        result.expenses.costA,
                        result.expenses.costB
                      )}
                    />
                    <NoteCell useBadge={false}>
                      <div className="flex flex-col items-end gap-0.5 text-[11px] leading-tight text-muted-foreground/80">
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">A</span>{formatCurrency(-result.expenses.costA, baseCurrency)}</span>
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">B</span>{formatCurrency(-result.expenses.costB, baseCurrency)}</span>
                      </div>
                    </NoteCell>
                  </tr>
                )}
                {result.expenses.tipA + result.expenses.tipB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">{t.expenses.tip}</td>
                    <AmountCell
                      amount={-(result.expenses.tipA + result.expenses.tipB)}
                      baseCurrency={baseCurrency}
                      exchangeRates={exchangeRates}
                      forceNegativeStyle
                      formula={expenseFormula(
                        t.expenses.tip,
                        result.expenses.tipA,
                        result.expenses.tipB
                      )}
                    />
                    <NoteCell useBadge={false}>
                      <div className="flex flex-col items-end gap-0.5 text-[11px] leading-tight text-muted-foreground/80">
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">A</span>{formatCurrency(-result.expenses.tipA, baseCurrency)}</span>
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">B</span>{formatCurrency(-result.expenses.tipB, baseCurrency)}</span>
                      </div>
                    </NoteCell>
                  </tr>
                )}
                {result.expenses.markA + result.expenses.markB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">{t.expenses.mark}</td>
                    <AmountCell
                      amount={-(result.expenses.markA + result.expenses.markB)}
                      baseCurrency={baseCurrency}
                      exchangeRates={exchangeRates}
                      forceNegativeStyle
                      formula={expenseFormula(
                        t.expenses.mark,
                        result.expenses.markA,
                        result.expenses.markB
                      )}
                    />
                    <NoteCell useBadge={false}>
                      <div className="flex flex-col items-end gap-0.5 text-[11px] leading-tight text-muted-foreground/80">
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">A</span>{formatCurrency(-result.expenses.markA, baseCurrency)}</span>
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">B</span>{formatCurrency(-result.expenses.markB, baseCurrency)}</span>
                      </div>
                    </NoteCell>
                  </tr>
                )}
                {result.expenses.taxA + result.expenses.taxB > 0 && (
                  <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
                    <td className="px-2 py-3 text-[13px] text-foreground sm:px-3 sm:text-sm">
                      {t.expenses.tax}
                      {result.expenses.taxPercent > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground/70">{result.expenses.taxPercent}%</span>}
                    </td>
                    <AmountCell
                      amount={-(result.expenses.taxA + result.expenses.taxB)}
                      baseCurrency={baseCurrency}
                      exchangeRates={exchangeRates}
                      forceNegativeStyle
                      formula={expenseFormula(
                        t.expenses.tax,
                        result.expenses.taxA,
                        result.expenses.taxB
                      )}
                    />
                    <NoteCell useBadge={false}>
                      <div className="flex flex-col items-end gap-0.5 text-[11px] leading-tight text-muted-foreground/80">
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">A</span>{formatCurrency(-result.expenses.taxA, baseCurrency)}</span>
                        <span><span className="mr-1 font-semibold text-muted-foreground/60">B</span>{formatCurrency(-result.expenses.taxB, baseCurrency)}</span>
                      </div>
                    </NoteCell>
                  </tr>
                )}
              </>
            )}

            {/* Revenue total - accent bar */}
            <tr className="accent-bar-red border-b border-border/40 bg-brand-red/8">
              <td className="px-2 py-4 text-sm font-bold text-foreground sm:px-3 sm:text-base">
                {t.result.revenue}
              </td>
              <AmountCell
                amount={result.totalRevenue}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                bold
                formula={formulaText(
                  t.formula.revenue,
                  `${money(result.revenueA)} + ${money(result.revenueB)} = ${money(result.totalRevenue)}`
                )}
              />
              <NoteCell bold>100%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.revenueA}</td>
              <AmountCell
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={formulaText(
                  t.formula.revenueA,
                  `${money(result.balanceA)} - ${money(feeForA)} - ${money(result.expenseTotalA)} = ${money(result.revenueA)}`
                )}
              />
              <NoteCell>{revenueAPercent.toFixed(2)}%</NoteCell>
            </tr>

            <tr className="border-b border-border/20 transition-colors hover:bg-surface/30">
              <td className="py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm">{t.result.revenueB}</td>
              <AmountCell
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                formula={formulaText(
                  revenueBFormula,
                  revenueBValues
                )}
              />
              <NoteCell>{revenueBPercent.toFixed(2)}%</NoteCell>
            </tr>

            {/* Distribution total - accent bar */}
            <tr className="accent-bar-gold border-b border-border/40 bg-brand-gold/8">
              <td className="px-2 py-4 text-sm font-bold text-foreground sm:px-3 sm:text-base">
                {t.result.distribution}
              </td>
              <AmountCell
                amount={distributionTotal}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
                bold
                formula={formulaText(
                  t.formula.distribution,
                  `${money(result.revenueB)} = ${money(distributionTotal)}`
                )}
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
                <td className="max-w-0 py-3 pl-4 pr-2 text-[13px] text-foreground/80 sm:pl-6 sm:pr-3 sm:text-sm"><span className="block truncate">{dist.memberName}</span></td>
                <AmountCell
                  amount={dist.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                  formula={memberDistributionFormula(dist.percentage, dist.amount)}
                />
                <NoteCell useBadge={false}>
                  <div className="flex flex-col items-end gap-1">
                    <RatioBadge>{dist.percentage.toFixed(1)}%</RatioBadge>
                    {dist.overallPercent > 0 && (
                      <span className="whitespace-nowrap text-[9px] leading-none text-muted-foreground/70 sm:text-[10px]">
                        {dist.overallPercent.toFixed(1)}% {t.result.withinB}
                      </span>
                    )}
                  </div>
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
