'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { formatCurrency } from '@/lib/currency';
import type { Currency, SettlementResult } from '@/types';

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
}

function ChartTooltip({ data, x, y }: { data: TooltipData | null; x: number; y: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !data) return null;

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
    </div>,
    document.body
  );
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
  const revenueBPercent = 100 - revenueAPercent;
  const totalFees = result.rollingFees.reduce((s, r) => s + r.amount, 0);
  const distributionTotal = result.distribution.reduce((s, d) => s + d.amount, 0);

  const cards = [
    { label: t.input.balance, value: result.balance, color: 'text-foreground' },
    { label: `${t.input.targetA} ${t.input.balance}`, value: result.balanceA, color: result.balanceA < 0 ? 'text-brand-red' : 'text-foreground' },
    { label: `${t.input.targetB} ${t.input.balance}`, value: result.balanceB, color: result.balanceB < 0 ? 'text-brand-red' : 'text-foreground' },
    { label: t.input.rollingFee, value: -totalFees, color: 'text-brand-red' },
    { label: `${t.result.revenueA} (${revenueAPercent}%)`, value: result.revenueA, color: 'text-brand-gold' },
    { label: `${t.result.revenueB} (${revenueBPercent}%)`, value: result.revenueB, color: 'text-brand-gold' },
    { label: t.result.distribution, value: distributionTotal, color: distributionTotal < 0 ? 'text-brand-red' : 'text-foreground' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col items-center rounded-xl border border-border/30 bg-surface/50 px-2 py-3 text-center transition-all duration-200 hover:scale-[1.02] hover:border-border/50 hover:shadow-sm"
        >
          <span className="text-[11px] font-medium text-muted-foreground">{c.label}</span>
          <span className={`mt-1.5 text-sm font-bold tabular-nums ${c.color}`}>
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
}

function DonutChart({ result, baseCurrency, revenueAPercent }: InfographicsProps) {
  const { t } = useTranslation();
  const { data: tipData, pos: tipPos, show, move, hide } = useTooltip();
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const revenueBPercent = 100 - revenueAPercent;

  const outerSegments: ChartSegment[] = [
    { key: 'o-0', label: t.result.revenueA, pct: revenueAPercent, color: '#C0301E', amount: result.revenueA },
    { key: 'o-1', label: t.result.revenueB, pct: revenueBPercent, color: 'var(--brand-gold)', amount: result.revenueB },
  ];

  const innerSegments: ChartSegment[] = result.distribution.map((d, i) => ({
    key: `i-${i}`,
    label: d.memberName,
    pct: d.overallPercent > 0 ? d.overallPercent : d.percentage,
    color: `hsl(${15 + i * 25}, 70%, ${45 + i * 8}%)`,
    amount: d.amount,
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
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-5">
      <div className="relative mx-auto size-36 shrink-0">
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground">{t.result.revenue}</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(result.totalRevenue, baseCurrency)}
          </span>
        </div>
      </div>

      <div className="min-w-0 space-y-1.5 text-xs">
        {outerSegments.map((s) => (
          <div
            key={s.label}
            role="img"
            aria-label={`${s.label}: ${s.pct}%`}
            className="grid cursor-pointer grid-cols-[0.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors duration-200"
            style={{ backgroundColor: hovered === s.key ? 'var(--surface)' : 'transparent' }}
            onMouseEnter={(e) => onSegEnter(e, s)}
            onMouseMove={onSegMove}
            onMouseLeave={onSegLeave}
          >
            <span className="inline-block size-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="font-bold tabular-nums text-foreground">{s.pct}%</span>
          </div>
        ))}
        <div className="my-0.5 border-t border-border/20" />
        {innerSegments.map((s) => (
          <div
            key={s.key}
            role="img"
            aria-label={`${s.label}: ${s.pct.toFixed(1)}%`}
            className="grid cursor-pointer grid-cols-[0.625rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors duration-200"
            style={{ backgroundColor: hovered === s.key ? 'var(--surface)' : 'transparent' }}
            onMouseEnter={(e) => onSegEnter(e, s)}
            onMouseMove={onSegMove}
            onMouseLeave={onSegLeave}
          >
            <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span className="tabular-nums text-foreground">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <ChartTooltip data={tipData} x={tipPos.x} y={tipPos.y} />
    </div>
  );
}

/* ── Waterfall Chart (CSS bars) ── */

function WaterfallChart({ result, baseCurrency }: InfographicsProps) {
  const { t } = useTranslation();
  const { data: tipData, pos: tipPos, show, move, hide } = useTooltip();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
    <div className="flex flex-col gap-2.5">
      {items.map((item, idx) => {
        const rawPct = Math.min((Math.abs(item.value) / maxAbs) * 100, 100);
        const widthPct = Math.max(rawPct, 2);
        const barColor =
          item.type === 'negative'
            ? 'bg-brand-red'
            : item.type === 'positive'
              ? 'bg-brand-gold/70'
              : 'bg-brand-gold/30';

        const isActive = hoveredIdx === idx;
        const anyHovered = hoveredIdx !== null;

        return (
          <div
            key={item.label}
            role="img"
            aria-label={`${item.label}: ${formatCurrency(item.value, baseCurrency)}`}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-1 transition-opacity duration-200"
            style={{ opacity: anyHovered ? (isActive ? 1 : 0.35) : 1 }}
            onMouseEnter={(e) => {
              setHoveredIdx(idx);
              show(e, {
                label: item.label,
                amount: formatCurrency(item.value, baseCurrency),
                detail: `${widthPct.toFixed(1)}%`,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHoveredIdx(null); hide(); }}
          >
            <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{item.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface/50">
              <div
                className={`absolute inset-y-0 left-0 rounded-md transition-all duration-300 ${barColor}`}
                style={{
                  width: `${widthPct}%`,
                  filter: isActive ? 'brightness(1.15)' : 'none',
                }}
              />
            </div>
            <span className={`w-24 shrink-0 text-right text-xs font-medium tabular-nums ${item.value < 0 ? 'text-brand-red' : 'text-foreground'}`}>
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

  return (
    <div className="space-y-3 overflow-hidden">
      <div>
        <div className="mb-1.5 text-xs text-muted-foreground">{t.result.revenue}</div>
        <div className="flex h-7 overflow-hidden rounded-lg">
          <div
            role="img"
            aria-label={`${t.result.revenueA}: ${revenueAPercent}%`}
            className="flex cursor-pointer items-center justify-center bg-brand-red text-xs font-bold text-white transition-all duration-200"
            style={{
              width: `${revenueAPercent}%`,
              opacity: hovered !== null ? (hovered === 'rev-a' ? 1 : 0.35) : 1,
              filter: hovered === 'rev-a' ? 'brightness(1.15)' : 'none',
            }}
            onMouseEnter={(e) => {
              setHovered('rev-a');
              show(e, {
                label: t.result.revenueA,
                amount: formatCurrency(result.revenueA, baseCurrency),
                detail: `${revenueAPercent}%`,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHovered(null); hide(); }}
          >
            {revenueAPercent > 10 && `A ${revenueAPercent}%`}
          </div>
          <div
            role="img"
            aria-label={`${t.result.revenueB}: ${revenueBPercent}%`}
            className="flex cursor-pointer items-center justify-center bg-brand-gold text-xs font-bold text-background transition-all duration-200"
            style={{
              width: `${revenueBPercent}%`,
              opacity: hovered !== null ? (hovered === 'rev-b' ? 1 : 0.35) : 1,
              filter: hovered === 'rev-b' ? 'brightness(1.15)' : 'none',
            }}
            onMouseEnter={(e) => {
              setHovered('rev-b');
              show(e, {
                label: t.result.revenueB,
                amount: formatCurrency(result.revenueB, baseCurrency),
                detail: `${revenueBPercent}%`,
              });
            }}
            onMouseMove={move}
            onMouseLeave={() => { setHovered(null); hide(); }}
          >
            {revenueBPercent > 10 && `B ${revenueBPercent}%`}
          </div>
        </div>
      </div>

      {result.distribution.length > 0 && totalPct > 0 && (
        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">{t.result.distribution}</div>
          <div className="flex h-7 overflow-hidden rounded-lg">
            {result.distribution.map((d, i) => {
              const widthPct = (Math.abs(d.percentage) / totalPct) * 100;
              const hue = 15 + i * 25;
              const key = `dist-${i}`;
              const isActive = hovered === key;
              const anyHovered = hovered !== null;
              const detailParts = [`${d.percentage}%`];
              if (d.overallPercent > 0) detailParts.push(`${d.overallPercent}% ${t.result.withinB}`);

              return (
                <div
                  key={d.memberId}
                  role="img"
                  aria-label={`${d.memberName}: ${d.percentage}%`}
                  className="flex cursor-pointer items-center justify-center text-xs font-medium text-white transition-all duration-200"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: `hsl(${hue}, 70%, ${45 + i * 8}%)`,
                    opacity: anyHovered ? (isActive ? 1 : 0.35) : 1,
                    filter: isActive ? 'brightness(1.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    setHovered(key);
                    show(e, {
                      label: d.memberName,
                      amount: formatCurrency(d.amount, baseCurrency),
                      detail: detailParts.join(' · '),
                    });
                  }}
                  onMouseMove={move}
                  onMouseLeave={() => { setHovered(null); hide(); }}
                >
                  {widthPct > 12 && d.memberName}
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
