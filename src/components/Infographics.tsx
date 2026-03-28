'use client';

import React from 'react';
import { useTranslation } from '@/i18n';
import { formatCurrency } from '@/lib/currency';
import type { Currency, SettlementResult } from '@/types';

interface InfographicsProps {
  result: SettlementResult;
  baseCurrency: Currency;
  revenueAPercent: number;
}

/* ── Summary Cards ── */

function SummaryCards({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const revenueBPercent = 100 - revenueAPercent;
  const totalFees = result.rollingFees.reduce((s, r) => s + r.amount, 0);
  const distributionTotal = result.distribution.reduce((s, d) => s + d.amount, 0);

  const cards = [
    { label: t.input.balance, value: result.balance, color: 'text-foreground' },
    { label: t.input.rollingFee, value: -totalFees, color: 'text-brand-red' },
    { label: `${t.result.revenueA} (${revenueAPercent}%)`, value: result.revenueA, color: 'text-brand-gold' },
    { label: `${t.result.revenueB} (${revenueBPercent}%)`, value: result.revenueB, color: 'text-brand-gold' },
    { label: t.result.distribution, value: distributionTotal, color: distributionTotal < 0 ? 'text-brand-red' : 'text-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col items-center rounded-lg border border-border/40 bg-surface px-2 py-3 text-center"
        >
          <span className="text-xs text-muted-foreground">{c.label}</span>
          <span className={`mt-1 text-sm font-bold tabular-nums ${c.color}`}>
            {formatCurrency(c.value, baseCurrency)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut Chart (SVG) ── */

function DonutChart({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const revenueBPercent = 100 - revenueAPercent;

  const outerSegments = [
    { label: t.result.revenueA, pct: revenueAPercent, color: '#C0301E' },
    { label: t.result.revenueB, pct: revenueBPercent, color: 'var(--brand-gold)' },
  ];

  const innerSegments = result.distribution.map((d, i) => ({
    label: d.memberName,
    pct: d.overallPercent > 0 ? d.overallPercent : d.percentage,
    color: `hsl(${15 + i * 25}, 70%, ${45 + i * 8}%)`,
  }));

  const renderRing = (
    segments: { label: string; pct: number; color: string }[],
    r: number,
    stroke: number
  ) => {
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const totalPct = segments.reduce((s, seg) => s + Math.abs(seg.pct), 0);

    return segments.map((seg) => {
      const normalizedPct = totalPct > 0 ? (Math.abs(seg.pct) / totalPct) * 100 : 0;
      const dashLength = (normalizedPct / 100) * circumference;
      const dashGap = circumference - dashLength;
      const el = (
        <circle
          key={seg.label}
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dashLength} ${dashGap}`}
          strokeDashoffset={-offset}
          className="transition-all duration-500"
        />
      );
      offset += dashLength;
      return el;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" aria-hidden="true">
        {renderRing(outerSegments, 50, 14)}
        {innerSegments.length > 0 && renderRing(innerSegments, 34, 10)}
      </svg>
      <div className="flex flex-col gap-1.5 text-xs">
        {outerSegments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="inline-block size-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-bold tabular-nums text-foreground">{s.pct}%</span>
          </div>
        ))}
        <div className="my-0.5 border-t border-border/30" />
        {innerSegments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tabular-nums text-foreground">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Waterfall Chart (CSS bars) ── */

function WaterfallChart({ result, baseCurrency }: InfographicsProps) {
  const { t } = useTranslation();
  const totalFees = result.rollingFees.reduce((s, r) => s + r.amount, 0);
  const distributionTotal = result.distribution.reduce((s, d) => s + d.amount, 0);

  const items = [
    { label: t.input.buying, value: result.balance > 0 ? result.balance : 0, type: 'positive' as const },
    { label: t.input.rollingFee, value: -totalFees, type: 'negative' as const },
    { label: t.result.revenueA, value: result.revenueA, type: 'neutral' as const },
    { label: t.result.revenueB, value: result.revenueB, type: 'neutral' as const },
    { label: t.result.distribution, value: distributionTotal, type: distributionTotal >= 0 ? 'positive' as const : 'negative' as const },
  ];

  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const widthPct = Math.min((Math.abs(item.value) / maxAbs) * 100, 100);
        const barColor =
          item.type === 'negative'
            ? 'bg-brand-red'
            : item.type === 'positive'
              ? 'bg-brand-gold/80'
              : 'bg-brand-gold/40';

        return (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{item.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-surface">
              <div
                className={`absolute inset-y-0 left-0 rounded transition-all duration-500 ${barColor}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className={`w-24 shrink-0 text-right text-xs font-medium tabular-nums ${item.value < 0 ? 'text-brand-red' : 'text-foreground'}`}>
              {formatCurrency(item.value, baseCurrency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Stacked Bar ── */

function StackedBar({ result, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const revenueBPercent = 100 - revenueAPercent;
  const totalPct = result.distribution.reduce((s, d) => s + Math.abs(d.percentage), 0);

  return (
    <div className="space-y-3 overflow-hidden">
      <div>
        <div className="mb-1 text-xs text-muted-foreground">{t.result.revenue}</div>
        <div className="flex h-7 overflow-hidden rounded-md">
          <div
            className="flex items-center justify-center bg-brand-red text-xs font-bold text-white"
            style={{ width: `${revenueAPercent}%` }}
          >
            {revenueAPercent > 10 && `A ${revenueAPercent}%`}
          </div>
          <div
            className="flex items-center justify-center bg-brand-gold text-xs font-bold text-background"
            style={{ width: `${revenueBPercent}%` }}
          >
            {revenueBPercent > 10 && `B ${revenueBPercent}%`}
          </div>
        </div>
      </div>

      {result.distribution.length > 0 && totalPct > 0 && (
        <div>
          <div className="mb-1 text-xs text-muted-foreground">{t.result.distribution}</div>
          <div className="flex h-7 overflow-hidden rounded-md">
            {result.distribution.map((d, i) => {
              const widthPct = (Math.abs(d.percentage) / totalPct) * 100;
              const hue = 15 + i * 25;
              return (
                <div
                  key={d.memberId}
                  className="flex items-center justify-center text-xs font-medium text-white"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: `hsl(${hue}, 70%, ${45 + i * 8}%)`,
                  }}
                >
                  {widthPct > 12 && d.memberName}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Infographics ── */

export function Infographics({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-lg shadow-black/10">
        <SummaryCards result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-lg shadow-black/10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-gold/70">
            {t.result.revenue}
          </h3>
          <DonutChart result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-lg shadow-black/10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-gold/70">
            {t.result.distribution}
          </h3>
          <StackedBar result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-lg shadow-black/10">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-gold/70">
          Cash Flow
        </h3>
        <WaterfallChart result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
      </div>
    </div>
  );
}
