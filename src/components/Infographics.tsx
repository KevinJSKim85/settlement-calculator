'use client';

import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { formatCurrency } from '@/lib/currency';
import type {
  Currency,
  DistributionAmount,
  RollingFeeResult,
  SettlementResult,
} from '@/types';
import type { TranslationKeys } from '@/i18n';

interface InfographicsProps {
  result: SettlementResult;
  baseCurrency: Currency;
  revenueAPercent: number;
}

/* ── Chart Tooltip ── */

interface TooltipData {
  label: string;
  amount: string;
  detail: string;
  formula?: string;
}

function ChartTooltip({ data, x, y }: { data: TooltipData | null; x: number; y: number }) {
  if (!data || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-border/40 bg-popover/95 px-3 py-2 text-popover-foreground shadow-xl backdrop-blur-md"
      style={{ left: x + 14, top: y - 10 }}
    >
      <div className="text-xs font-semibold">{data.label}</div>
      <div className="mt-0.5 text-sm font-bold tabular-nums">{data.amount}</div>
      {data.detail && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{data.detail}</div>
      )}
      {data.formula && (
        <div className="mt-1 max-w-64 whitespace-pre-line border-t border-border/30 pt-1 text-[11px] leading-snug text-muted-foreground">
          {data.formula}
        </div>
      )}
    </div>,
    document.body
  );
}

function createFormulaContext(
  result: SettlementResult,
  baseCurrency: Currency,
  revenueAPercent: number,
  t: TranslationKeys
) {
  const revenueBPercent = 100 - revenueAPercent;
  const feeForA = result.rollingFees
    .filter((rf) => rf.target === 'A')
    .reduce((sum, rf) => sum + rf.amount, 0);
  const feeForB = result.rollingFees
    .filter((rf) => rf.target === 'B')
    .reduce((sum, rf) => sum + rf.amount, 0);
  const totalFees = result.rollingFees.reduce((sum, rf) => sum + rf.amount, 0);
  const distributionTotal = result.distribution.reduce((sum, d) => sum + d.amount, 0);
  const money = (amount: number) => formatCurrency(amount, baseCurrency);
  const ratio = (value: number) => `${value.toFixed(2)}%`;
  const formulaText = (formula: string, values?: string) =>
    values
      ? `${t.formula.label}: ${formula}\n${t.formula.values}: ${values}`
      : `${t.formula.label}: ${formula}`;
  const rollingFeeFormula = (fee: RollingFeeResult) =>
    formulaText(
      t.formula.rollingFee,
      `${money(fee.sourceAmount)} × ${fee.feePercent}% = ${money(-fee.amount)}`
    );
  const revenueBFormula = result.applyFxRevenueBShare
    ? t.formula.revenueBShared
    : t.formula.revenueB;
  const revenueBValues = result.applyFxRevenueBShare
    ? `${money(result.balanceB)} × ${ratio(revenueBPercent)} - ${money(feeForB)} - ${money(result.expenseTotalB)} = ${money(result.revenueB)}`
    : `${money(result.balanceB)} - ${money(feeForB)} - ${money(result.expenseTotalB)} = ${money(result.revenueB)}`;
  const memberFormula = (member: DistributionAmount) =>
    revenueBPercent <= 0
      ? formulaText(t.formula.memberDistributionZero, money(member.amount))
      : formulaText(
          t.formula.memberDistribution,
          `${money(result.revenueB)} × ${member.percentage.toFixed(1)}% ÷ ${ratio(revenueBPercent)} = ${money(member.amount)}`
        );

  return {
    revenueBPercent,
    totalFees,
    distributionTotal,
    money,
    balance: formulaText(
      t.formula.balance,
      `${money(result.balanceA)} + ${money(result.balanceB)} = ${money(result.balance)}`
    ),
    balanceA: formulaText(
      t.formula.balanceA,
      `${money(result.buyingA)} - ${money(result.returningA)} = ${money(result.balanceA)}`
    ),
    balanceB: formulaText(
      t.formula.balanceB,
      `${money(result.balance)} - ${money(result.balanceA)} = ${money(result.balanceB)}`
    ),
    rollingTotal: formulaText(
      t.formula.rollingTotal,
      result.rollingFees.length > 0
        ? `${result.rollingFees.map((fee) => money(-fee.amount)).join(' + ')} = ${money(-totalFees)}`
        : money(0)
    ),
    rollingFeeFormula,
    revenue: formulaText(
      t.formula.revenue,
      `${money(result.revenueA)} + ${money(result.revenueB)} = ${money(result.totalRevenue)}`
    ),
    revenueA: formulaText(
      t.formula.revenueA,
      `${money(result.balanceA)} - ${money(feeForA)} - ${money(result.expenseTotalA)} = ${money(result.revenueA)}`
    ),
    revenueB: formulaText(revenueBFormula, revenueBValues),
    distribution: formulaText(
      t.formula.distribution,
      `${money(result.revenueB)} = ${money(distributionTotal)}`
    ),
    memberFormula,
    cashFlow: formulaText(t.formula.cashFlow),
  };
}

function useTooltip() {
  const [data, setData] = useState<TooltipData | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const show = useCallback((e: React.MouseEvent, d: TooltipData) => {
    setPos({ x: e.clientX, y: e.clientY });
    setData(d);
  }, []);

  const move = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hide = useCallback(() => { setData(null); }, []);

  return { data, pos, show, move, hide };
}

/* ── Summary Cards ── */

function SummaryCards({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const formulas = createFormulaContext(result, baseCurrency, revenueAPercent, t);

  const cards = [
    { label: t.input.balance, value: result.balance, color: 'text-foreground', formula: formulas.balance },
    {
      label: `${t.input.targetA} ${t.input.balance}`,
      value: result.balanceA,
      color: result.balanceA < 0 ? 'text-brand-red' : 'text-foreground',
      formula: formulas.balanceA,
    },
    {
      label: `${t.input.targetB} ${t.input.balance}`,
      value: result.balanceB,
      color: result.balanceB < 0 ? 'text-brand-red' : 'text-foreground',
      formula: formulas.balanceB,
    },
    {
      label: t.input.rollingFee,
      value: -formulas.totalFees,
      color: 'text-brand-red',
      formula: formulas.rollingTotal,
    },
    {
      label: `${t.result.revenueA} (${revenueAPercent.toFixed(2)}%)`,
      value: result.revenueA,
      color: 'text-brand-gold',
      formula: formulas.revenueA,
    },
    {
      label: `${t.result.revenueB} (${formulas.revenueBPercent.toFixed(2)}%)`,
      value: result.revenueB,
      color: 'text-brand-gold',
      formula: formulas.revenueB,
    },
    {
      label: t.result.distribution,
      value: formulas.distributionTotal,
      color: formulas.distributionTotal < 0 ? 'text-brand-red' : 'text-foreground',
      formula: formulas.distribution,
    },
  ];

  return (
    <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/30 bg-surface/40 overflow-hidden">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex cursor-help items-start justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-surface/70"
          title={c.formula}
          aria-label={c.formula}
        >
          <span className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 sm:text-xs">
            {c.label}
          </span>
          <span className={`min-w-0 max-w-[55%] break-words text-right text-sm font-bold tabular-nums leading-tight sm:text-base ${c.color}`}>
            {formatCurrency(c.value, baseCurrency)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut Chart (SVG) ── */

interface ChartSegment {
  key: string;
  label: string;
  pct: number;
  color: string;
  amount: number;
  formula: string;
}

function DonutChart({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const { data: tipData, pos: tipPos, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const revenueBPercent = 100 - revenueAPercent;
  const formulas = createFormulaContext(result, baseCurrency, revenueAPercent, t);

  const outerSegments: ChartSegment[] = [
    {
      key: 'o-0',
      label: t.result.revenueA,
      pct: revenueAPercent,
      color: '#C0301E',
      amount: result.revenueA,
      formula: formulas.revenueA,
    },
    {
      key: 'o-1',
      label: t.result.revenueB,
      pct: revenueBPercent,
      color: 'var(--brand-gold)',
      amount: result.revenueB,
      formula: formulas.revenueB,
    },
  ];

  const innerSegments: ChartSegment[] = result.distribution.map((d, i) => ({
    key: `i-${i}`,
    label: d.memberName,
    pct: d.overallPercent > 0 ? d.overallPercent : d.percentage,
    color: `hsl(${15 + i * 25}, 70%, ${45 + i * 8}%)`,
    amount: d.amount,
    formula: formulas.memberFormula(d),
  }));

  const setHoveredSync = useCallback((key: string | null) => {
    hoveredRef.current = key;
    setHovered(key);
  }, []);

  const onSegEnter = useCallback((e: React.MouseEvent, seg: ChartSegment) => {
    setHoveredSync(seg.key);
    show(e, {
      label: seg.label,
      amount: formatCurrency(seg.amount, baseCurrency),
      detail: `${seg.pct.toFixed(1)}%`,
      formula: seg.formula,
    });
  }, [baseCurrency, show, setHoveredSync]);

  const onSegMove = move;

  const onSegLeave = useCallback(() => {
    setHoveredSync(null);
    hide();
  }, [hide, setHoveredSync]);

  const findSegmentAtAngle = (segments: ChartSegment[], angleDeg: number) => {
    const totalPct = segments.reduce((s, seg) => s + Math.abs(seg.pct), 0);
    if (totalPct === 0) return null;
    let cum = 0;
    for (const seg of segments) {
      const span = (Math.abs(seg.pct) / totalPct) * 360;
      if (angleDeg >= cum && angleDeg < cum + span) return seg;
      cum += span;
    }
    return null;
  };

  const handleSvgMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * 120;
    const vy = ((e.clientY - rect.top) / rect.height) * 120;

    const sx = 120 - vy;
    const sy = vx;
    const dx = sx - 60;
    const dy = sy - 60;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let segments: ChartSegment[] | null = null;
    if (dist >= 43 && dist <= 57) segments = outerSegments;
    else if (dist >= 29 && dist <= 39 && innerSegments.length > 0) segments = innerSegments;

    if (!segments) {
      if (hoveredRef.current !== null) { setHoveredSync(null); hide(); }
      return;
    }

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const found = findSegmentAtAngle(segments, angle);
    if (found) {
      if (found.key !== hoveredRef.current) {
        setHoveredSync(found.key);
        show(e, {
          label: found.label,
          amount: formatCurrency(found.amount, baseCurrency),
          detail: `${found.pct.toFixed(1)}%`,
          formula: found.formula,
        });
      } else {
        move(e);
      }
    } else {
      if (hoveredRef.current !== null) { setHoveredSync(null); hide(); }
    }
  };

  const renderRing = (segments: ChartSegment[], r: number, stroke: number) => {
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const totalPct = segments.reduce((s, seg) => s + Math.abs(seg.pct), 0);

    return segments.map((seg) => {
      const normalizedPct = totalPct > 0 ? (Math.abs(seg.pct) / totalPct) * 100 : 0;
      const dashLength = (normalizedPct / 100) * circumference;
      const dashGap = circumference - dashLength;
      const curOffset = offset;
      offset += dashLength;

      const isActive = hovered === seg.key;
      const anyHovered = hovered !== null;

      return (
        <circle
          key={seg.key}
          cx="60" cy="60" r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={isActive ? stroke + 2 : stroke}
          strokeDasharray={`${dashLength} ${dashGap}`}
          strokeDashoffset={-curOffset}
          className="transition-all duration-300"
          style={{ opacity: anyHovered ? (isActive ? 1 : 0.3) : 1 }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative size-36 shrink-0 sm:size-40">
        <svg
          viewBox="0 0 120 120"
          className="size-full -rotate-90 cursor-pointer"
          aria-hidden="true"
          onMouseMove={handleSvgMove}
          onMouseLeave={() => { setHoveredSync(null); hide(); }}
        >
          {renderRing(outerSegments, 50, 14)}
          {innerSegments.length > 0 && renderRing(innerSegments, 34, 10)}
        </svg>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-2 text-center">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/80 sm:text-[9px]">
            {t.result.revenue}
          </span>
          <span className="text-[13px] font-bold tabular-nums leading-tight text-foreground sm:text-sm">
            {formatCurrency(result.totalRevenue, baseCurrency)}
          </span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1 text-xs">
        {outerSegments.map((s) => {
          const isActive = hovered === s.key;
          return (
            <div
              key={s.label}
              role="img"
              aria-label={`${s.label}: ${s.pct}%`}
              title={s.formula}
              className="grid cursor-pointer grid-cols-[0.75rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2 py-1 transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                opacity: hovered !== null && !isActive ? 0.5 : 1,
              }}
              onMouseEnter={(e) => onSegEnter(e, s)}
              onMouseMove={onSegMove}
              onMouseLeave={onSegLeave}
            >
              <span
                className="inline-block size-3 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-card"
                style={{ backgroundColor: s.color, boxShadow: `0 0 0 1px ${s.color}40` }}
              />
              <span className="truncate font-medium text-foreground/90">{s.label}</span>
              <span className="font-bold tabular-nums text-foreground">{s.pct.toFixed(1)}%</span>
            </div>
          );
        })}
        {innerSegments.length > 0 && (
          <div className="my-1.5 flex items-center gap-2 px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            <span className="h-px flex-1 bg-border/30" />
            <span>{t.result.distribution}</span>
            <span className="h-px flex-1 bg-border/30" />
          </div>
        )}
        {innerSegments.map((s) => {
          const isActive = hovered === s.key;
          return (
            <div
              key={s.key}
              role="img"
              aria-label={`${s.label}: ${s.pct.toFixed(1)}%`}
              title={s.formula}
              className="grid cursor-pointer grid-cols-[0.625rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md px-2 py-0.5 transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                opacity: hovered !== null && !isActive ? 0.5 : 1,
              }}
              onMouseEnter={(e) => onSegEnter(e, s)}
              onMouseMove={onSegMove}
              onMouseLeave={onSegLeave}
            >
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="tabular-nums text-foreground/80">{s.pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>

      <ChartTooltip data={tipData} x={tipPos.x} y={tipPos.y} />
    </div>
  );
}

/* ── Waterfall Chart (CSS bars) ── */

function WaterfallChart({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const { data: tipData, pos: tipPos, show, move, hide } = useTooltip();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const formulas = createFormulaContext(result, baseCurrency, revenueAPercent, t);

  const items = [
    {
      label: t.input.buying,
      value: result.balance > 0 ? result.balance : 0,
      type: 'inflow' as const,
      formula: formulas.balance,
    },
    {
      label: t.input.rollingFee,
      value: -formulas.totalFees,
      type: 'outflow' as const,
      formula: formulas.rollingTotal,
    },
    {
      label: t.result.revenueA,
      value: result.revenueA,
      type: 'revA' as const,
      formula: formulas.revenueA,
    },
    {
      label: t.result.revenueB,
      value: result.revenueB,
      type: 'revB' as const,
      formula: formulas.revenueB,
    },
    {
      label: t.result.distribution,
      value: formulas.distributionTotal,
      type: formulas.distributionTotal >= 0 ? 'distribution' as const : 'outflow' as const,
      formula: formulas.distribution,
    },
  ];

  const maxAbs = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  const barStyles: Record<string, string> = {
    inflow: 'bg-gradient-to-r from-emerald-500/70 to-emerald-400/60',
    outflow: 'bg-gradient-to-r from-brand-red to-brand-red/75',
    revA: 'bg-gradient-to-r from-brand-red/85 to-brand-red/60',
    revB: 'bg-gradient-to-r from-brand-gold to-brand-gold/70',
    distribution: 'bg-gradient-to-r from-brand-gold/90 via-brand-gold/60 to-brand-gold/40',
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => {
        const rawPct = Math.min((Math.abs(item.value) / maxAbs) * 100, 100);
        const widthPct = Math.max(rawPct, 2);
        const barColor = barStyles[item.type] ?? 'bg-brand-gold/40';

        const isActive = hoveredIdx === idx;
        const anyHovered = hoveredIdx !== null;

        return (
          <div
            key={item.label}
            role="img"
            aria-label={`${item.label}: ${formatCurrency(item.value, baseCurrency)}`}
            title={item.formula}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-1 transition-all duration-200 sm:gap-3"
            style={{ opacity: anyHovered ? (isActive ? 1 : 0.35) : 1 }}
            onMouseEnter={(e) => {
              setHoveredIdx(idx);
              show(e, {
                label: item.label,
                amount: formatCurrency(item.value, baseCurrency),
                detail: `${widthPct.toFixed(1)}%`,
                formula: item.formula,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHoveredIdx(null); hide(); }}
          >
            <span className="w-14 shrink-0 truncate text-right text-[10px] font-medium leading-snug text-muted-foreground sm:w-20 sm:text-[11px]">
              {item.label}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface/40 ring-1 ring-inset ring-border/20 sm:h-7">
              <div
                className={`absolute inset-y-0 left-0 rounded-md shadow-sm transition-all duration-500 ${barColor}`}
                style={{
                  width: `${widthPct}%`,
                  filter: isActive ? 'brightness(1.18) saturate(1.1)' : 'none',
                }}
              />
            </div>
            <span className={`w-[5.5rem] shrink-0 truncate text-right text-[10px] font-semibold leading-snug tabular-nums sm:w-24 sm:text-xs ${item.value < 0 ? 'text-brand-red' : 'text-foreground'}`}>
              {formatCurrency(item.value, baseCurrency)}
            </span>
          </div>
        );
      })}
      <ChartTooltip data={tipData} x={tipPos.x} y={tipPos.y} />
    </div>
  );
}

/* ── Stacked Bar ── */

function StackedBar({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const { data: tipData, pos: tipPos, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState<string | null>(null);
  const revenueBPercent = 100 - revenueAPercent;
  const totalPct = result.distribution.reduce((s, d) => s + Math.abs(d.percentage), 0);
  const formulas = createFormulaContext(result, baseCurrency, revenueAPercent, t);

  return (
    <div className="space-y-4 overflow-hidden">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t.result.revenue}
          </span>
        </div>
        <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-inset ring-border/20">
          <div
            role="img"
            aria-label={`${t.result.revenueA}: ${revenueAPercent.toFixed(2)}%`}
            title={formulas.revenueA}
            className="flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-r from-brand-red to-brand-red/85 text-[10px] font-bold tracking-wide text-white transition-all duration-200 sm:text-[11px]"
            style={{
              width: `${revenueAPercent.toFixed(2)}%`,
              opacity: hovered !== null ? (hovered === 'rev-a' ? 1 : 0.35) : 1,
              filter: hovered === 'rev-a' ? 'brightness(1.15) saturate(1.1)' : 'none',
            }}
            onMouseEnter={(e) => {
              setHovered('rev-a');
              show(e, {
                label: t.result.revenueA,
                amount: formatCurrency(result.revenueA, baseCurrency),
                detail: `${revenueAPercent.toFixed(2)}%`,
                formula: formulas.revenueA,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHovered(null); hide(); }}
          >
            {revenueAPercent > 15 && (
              <span className={revenueAPercent > 22 ? '' : 'hidden sm:inline'}>A  {revenueAPercent.toFixed(2)}%</span>
            )}
          </div>
          <div
            role="img"
            aria-label={`${t.result.revenueB}: ${revenueBPercent.toFixed(2)}%`}
            title={formulas.revenueB}
            className="flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-r from-brand-gold to-brand-gold/85 text-[10px] font-bold tracking-wide text-background transition-all duration-200 sm:text-[11px]"
            style={{
              width: `${revenueBPercent.toFixed(2)}%`,
              opacity: hovered !== null ? (hovered === 'rev-b' ? 1 : 0.35) : 1,
              filter: hovered === 'rev-b' ? 'brightness(1.15) saturate(1.1)' : 'none',
            }}
            onMouseEnter={(e) => {
              setHovered('rev-b');
              show(e, {
                label: t.result.revenueB,
                amount: formatCurrency(result.revenueB, baseCurrency),
                detail: `${revenueBPercent.toFixed(2)}%`,
                formula: formulas.revenueB,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHovered(null); hide(); }}
          >
            {revenueBPercent > 15 && (
              <span className={revenueBPercent > 22 ? '' : 'hidden sm:inline'}>B  {revenueBPercent.toFixed(2)}%</span>
            )}
          </div>
        </div>
      </div>

      {result.distribution.length > 0 && totalPct > 0 && (
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t.result.distribution}
          </div>
          <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-inset ring-border/20">
            {result.distribution.map((d, i) => {
              const widthPct = (Math.abs(d.percentage) / totalPct) * 100;
              const hue = 15 + i * 25;
              const key = `dist-${i}`;
              const isActive = hovered === key;
              const anyHovered = hovered !== null;
              const detailParts = [`${d.percentage.toFixed(1)}%`];
              if (d.overallPercent > 0) detailParts.push(`${d.overallPercent.toFixed(1)}% ${t.result.withinB}`);

              return (
                <div
                  key={d.memberId}
                  role="img"
                  aria-label={`${d.memberName}: ${d.percentage.toFixed(1)}%`}
                  title={formulas.memberFormula(d)}
                  className="flex cursor-pointer items-center justify-center gap-1 overflow-hidden px-1 text-[10px] font-semibold tracking-tight text-white transition-all duration-200 sm:text-[11px]"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: `hsl(${hue}, 70%, ${45 + i * 8}%)`,
                    opacity: anyHovered ? (isActive ? 1 : 0.35) : 1,
                    filter: isActive ? 'brightness(1.15) saturate(1.1)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    setHovered(key);
                    show(e, {
                      label: d.memberName,
                      amount: formatCurrency(d.amount, baseCurrency),
                      detail: detailParts.join(' · '),
                      formula: formulas.memberFormula(d),
                    });
                  }}
                  onMouseMove={move}
                  onMouseLeave={() => { setHovered(null); hide(); }}
                >
                  {widthPct > 15 && (
                    <span className={`truncate ${widthPct > 22 ? '' : 'hidden sm:inline'}`}>{d.memberName}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ChartTooltip data={tipData} x={tipPos.x} y={tipPos.y} />
    </div>
  );
}

/* ── Main Infographics ── */

export function Infographics({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="premium-card rounded-xl border border-border/40 bg-card p-4">
        <SummaryCards result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="premium-card overflow-hidden rounded-xl border border-border/40 bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <PieChart className="size-3.5" />
            {t.result.revenue}
          </h3>
          <DonutChart result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
        </div>

        <div className="premium-card overflow-hidden rounded-xl border border-border/40 bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="size-3.5" />
            {t.result.distribution}
          </h3>
          <StackedBar result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
        </div>
      </div>

      <div className="premium-card rounded-xl border border-border/40 bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <TrendingUp className="size-3.5" />
          Cash Flow
        </h3>
        <WaterfallChart result={result} baseCurrency={baseCurrency} revenueAPercent={revenueAPercent} />
      </div>
    </div>
  );
}
