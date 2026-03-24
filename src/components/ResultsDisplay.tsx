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
  rollingFeePercent: number;
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
    <div className="text-[11px] text-stone-400 mt-0.5 font-normal">
      {converted.map((c, i) => (
        <React.Fragment key={c.currency}>
          {i > 0 && <span className="mx-1 text-stone-300">|</span>}
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
}: {
  amount: number;
  baseCurrency: Currency;
  exchangeRates?: ExchangeRates;
  bold?: boolean;
}) {
  const isNegative = amount < 0;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    <td className="text-right py-2.5 px-3 align-top whitespace-nowrap">
      <div
        className={[
          bold ? 'font-semibold' : 'font-medium',
          isNegative ? 'text-red-600' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {formatCurrency(safeAmount, baseCurrency)}
        {isNegative && <span className="ml-1 text-[10px] text-red-500">(손실)</span>}
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
        'text-right py-2.5 px-3 text-sm tabular-nums',
        bold ? 'font-semibold text-stone-700' : 'text-stone-400',
      ].join(' ')}
    >
      {children}
    </td>
  );
}

const ResultsDisplay = React.forwardRef<HTMLDivElement, ResultsDisplayProps>(
  function ResultsDisplay(
    { result, exchangeRates, baseCurrency, rollingFeePercent, revenueAPercent },
    ref
  ) {
    const { t } = useTranslation();

    if (!result) {
      return (
        <div
          ref={ref}
          className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-400 text-sm"
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

    return (
      <div
        ref={ref}
        className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[400px]">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="text-left py-2 px-3 font-medium text-stone-500 text-xs uppercase tracking-wider">
                항목
              </th>
              <th className="text-right py-2 px-3 font-medium text-stone-500 text-xs uppercase tracking-wider">
                금액
              </th>
              <th className="text-right py-2 px-3 font-medium text-stone-500 text-xs uppercase tracking-wider w-20">
                비율
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="py-2.5 px-3 text-stone-700">{t.input.balance}</td>
              <AmountCell
                amount={result.balance}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell />
            </tr>

            <tr className="border-b border-stone-100">
              <td className="py-2.5 px-3 text-stone-700">{t.input.rollingFee}</td>
              <AmountCell
                amount={result.rollingFee}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{rollingFeePercent}%</NoteCell>
            </tr>

            <tr className="border-b border-stone-200 bg-amber-50">
              <td className="py-2.5 px-3 font-semibold text-stone-800">
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

            <tr className="border-b border-stone-100">
              <td className="py-2.5 px-3 text-stone-700 pl-6">{t.result.revenueA}</td>
              <AmountCell
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueAPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-stone-100">
              <td className="py-2.5 px-3 text-stone-700 pl-6">{t.result.revenueB}</td>
              <AmountCell
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                exchangeRates={exchangeRates}
              />
              <NoteCell>{revenueBPercent}%</NoteCell>
            </tr>

            <tr className="border-b border-stone-200 bg-amber-50">
              <td className="py-2.5 px-3 font-semibold text-stone-800">
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
                    ? 'border-b border-stone-100'
                    : ''
                }
              >
                <td className="py-2.5 px-3 text-stone-700 pl-6">
                  {t.result.distribution} {dist.memberName}
                </td>
                <AmountCell
                  amount={dist.amount}
                  baseCurrency={baseCurrency}
                  exchangeRates={exchangeRates}
                />
                <NoteCell>
                  {dist.percentage.toFixed(2)}%
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
