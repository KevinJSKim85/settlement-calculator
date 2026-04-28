'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { formatCurrency } from '@/lib/currency';
import type { Currency, ExchangeRates, SettlementResult } from '@/types';
import type { UserInfo } from '@/lib/store';

interface ExportDocumentProps {
  result: SettlementResult | null;
  baseCurrency: Currency;
  revenueAPercent: number;
  exchangeRates?: ExchangeRates;
  userInfo: UserInfo;
  inlineFxRate: number;
  inlineFxCurrency: Currency;
}

/* ── Tokens — hard-coded so export always renders identically regardless of theme ── */
const INK = '#14110F';
const INK_MUTED = '#6B645C';
const INK_SOFT = '#9A928A';
const PAPER = '#FFFFFF';
const PAPER_WARM = '#FBF7EF';
const LINE = '#E6DFD3';
const LINE_SOFT = '#F0EADF';
const RED = '#C0301E';
const GOLD = '#B8892F';

/* ── Mini donut chart (SVG) for revenue A/B split ── */
function MiniDonut({
  revenueA,
  revenueB,
  revenueAPercent,
}: {
  revenueA: number;
  revenueB: number;
  revenueAPercent: number;
}) {
  const revenueBPercent = 100 - revenueAPercent;
  const size = 110;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  const stroke = 16;
  const circumference = 2 * Math.PI * r;

  // Use absolute values so losses still render visually
  const absA = Math.abs(revenueA);
  const absB = Math.abs(revenueB);
  const total = absA + absB;

  // Fall back to percent-based split if amounts are both zero
  const aPct = total > 0 ? (absA / total) * 100 : revenueAPercent;
  const bPct = total > 0 ? (absB / total) * 100 : revenueBPercent;

  const aDash = (aPct / 100) * circumference;
  const bDash = (bPct / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={LINE_SOFT} strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={RED}
        strokeWidth={stroke}
        strokeDasharray={`${aDash} ${circumference - aDash}`}
        strokeDashoffset={0}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={GOLD}
        strokeWidth={stroke}
        strokeDasharray={`${bDash} ${circumference - bDash}`}
        strokeDashoffset={-aDash}
      />
    </svg>
  );
}

/* ── Member distribution bar (horizontal stacked) ── */
function MemberBar({
  result,
  baseCurrency,
}: {
  result: SettlementResult;
  baseCurrency: Currency;
}) {
  const totalPct = result.distribution.reduce(
    (sum, d) => sum + Math.abs(d.percentage),
    0,
  );
  if (totalPct <= 0 || result.distribution.length === 0) {
    return (
      <div
        style={{
          height: 18,
          borderRadius: 4,
          background: LINE_SOFT,
        }}
      />
    );
  }
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          height: 18,
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${LINE}`,
        }}
      >
        {result.distribution.map((d, i) => {
          const w = (Math.abs(d.percentage) / totalPct) * 100;
          const hue = 15 + i * 28;
          return (
            <div
              key={d.memberId}
              style={{
                width: `${w}%`,
                background: `hsl(${hue}, 62%, ${48 + i * 4}%)`,
              }}
              title={d.memberName}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
          gap: 4,
          marginTop: 6,
        }}
      >
        {result.distribution.map((d, i) => {
          const hue = 15 + i * 28;
          return (
            <div
              key={d.memberId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 8.5,
                color: INK_MUTED,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: `hsl(${hue}, 62%, ${48 + i * 4}%)`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  color: INK,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.memberName}
              </span>
              <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(d.amount, baseCurrency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Summary card ── */
function SummaryTile({
  label,
  amount,
  baseCurrency,
  accent,
}: {
  label: string;
  amount: number;
  baseCurrency: Currency;
  accent?: 'red' | 'gold' | 'ink';
}) {
  const color =
    accent === 'red' ? RED : accent === 'gold' ? GOLD : INK;
  return (
    <div
      style={{
        border: `1px solid ${LINE}`,
        padding: '10px 12px',
        borderRadius: 6,
        background: PAPER,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: INK_SOFT,
          marginBottom: 4,
          lineHeight: 1.25,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          overflowWrap: 'anywhere',
        }}
      >
        {formatCurrency(amount, baseCurrency)}
      </div>
    </div>
  );
}

/* ── Table row ── */
function Row({
  label,
  amount,
  baseCurrency,
  ratio,
  indent,
  negative,
  emphasized,
  accent,
  last,
}: {
  label: React.ReactNode;
  amount: number;
  baseCurrency: Currency;
  ratio?: React.ReactNode;
  indent?: boolean;
  negative?: boolean;
  emphasized?: boolean;
  accent?: 'red' | 'gold';
  last?: boolean;
}) {
  const amountColor = negative ? RED : emphasized ? INK : INK;
  const bg =
    accent === 'red'
      ? 'rgba(192, 48, 30, 0.06)'
      : accent === 'gold'
        ? 'rgba(184, 137, 47, 0.08)'
        : 'transparent';
  return (
    <tr
      style={{
        borderBottom: last ? 'none' : `1px solid ${LINE_SOFT}`,
        background: bg,
      }}
    >
      <td
        style={{
          padding: '7px 10px',
          paddingLeft: indent ? 28 : 10,
          fontSize: emphasized ? 11.5 : 10.5,
          fontWeight: emphasized ? 700 : 500,
          color: emphasized ? INK : indent ? INK_MUTED : INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 0,
          width: '50%',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '7px 10px',
          textAlign: 'right',
          fontSize: emphasized ? 12 : 11,
          fontWeight: emphasized ? 700 : 600,
          color: amountColor,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {formatCurrency(amount, baseCurrency)}
      </td>
      <td
        style={{
          padding: '7px 10px',
          textAlign: 'right',
          width: 64,
          fontSize: 9.5,
          fontWeight: emphasized ? 700 : 500,
          color: emphasized ? (accent === 'gold' ? GOLD : INK) : INK_SOFT,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {ratio ?? ''}
      </td>
    </tr>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 12px',
        borderRight: `1px solid ${LINE}`,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: INK_SOFT,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: value ? INK : INK_SOFT,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

export const ExportDocument = React.forwardRef<HTMLDivElement, ExportDocumentProps>(
  function ExportDocument(
    { result, baseCurrency, revenueAPercent, userInfo, inlineFxRate, inlineFxCurrency },
    ref,
  ) {
    const { t } = useTranslation();

    if (!result) {
      return <div ref={ref} style={{ width: 794 }} />;
    }

    const revenueBPercent = 100 - revenueAPercent;
    const distributionTotal = result.distribution.reduce(
      (sum, d) => sum + d.amount,
      0,
    );
    const rollingFeeLabel = (label: string) =>
      result.rollingFees.length > 1
        ? `${t.input.rollingFee} ${label}`
        : t.input.rollingFee;

    const nowStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return (
      <div
        ref={ref}
        style={{
          width: 794, // A4 portrait @ 96dpi
          minHeight: 1123,
          background: PAPER,
          color: INK,
          fontFamily:
            "'Times New Roman', 'Noto Serif KR', 'Songti SC', 'SimSun', serif",
          padding: '40px 44px 28px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Top brand bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: `2px solid ${INK}`,
            paddingBottom: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: RED,
                color: PAPER,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calculator size={22} strokeWidth={2.25} color={PAPER} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                  color: INK,
                }}
              >
                {t.app.title}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: INK_MUTED,
                  fontFamily:
                    "'Helvetica Neue', Arial, sans-serif",
                }}
              >
                {t.app.subtitle}
              </div>
            </div>
          </div>
          <div
            style={{
              textAlign: 'right',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: INK_SOFT,
                fontWeight: 600,
              }}
            >
              Document
            </div>
            <div
              style={{
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                color: INK,
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {userInfo.date || new Date().toISOString().slice(0, 10)}
            </div>
            {inlineFxRate > 0 && inlineFxCurrency !== baseCurrency && (
              <div
                style={{
                  fontSize: 9,
                  color: INK_MUTED,
                  marginTop: 3,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {inlineFxCurrency}/{baseCurrency}{' '}
                <span style={{ color: GOLD, fontWeight: 700 }}>
                  {inlineFxRate.toLocaleString('en-US', {
                    maximumFractionDigits: 4,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User info grid — 4 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            background: PAPER_WARM,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <InfoField label={t.header.code} value={userInfo.code} />
          <InfoField label={t.header.name} value={userInfo.name} />
          <InfoField label={t.header.date} value={userInfo.date} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: '8px 12px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_SOFT,
              }}
            >
              {t.header.location}
            </span>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: userInfo.location ? INK : INK_SOFT,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userInfo.location || '—'}
            </span>
          </div>
        </div>

        {/* Summary tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <SummaryTile
            label={t.input.balance}
            amount={result.balance}
            baseCurrency={baseCurrency}
            accent={result.balance < 0 ? 'red' : 'ink'}
          />
          <SummaryTile
            label={t.result.revenue}
            amount={result.totalRevenue}
            baseCurrency={baseCurrency}
            accent={result.totalRevenue < 0 ? 'red' : 'ink'}
          />
          <SummaryTile
            label={`${t.result.revenueA} · ${revenueAPercent.toFixed(2)}%`}
            amount={result.revenueA}
            baseCurrency={baseCurrency}
            accent="red"
          />
          <SummaryTile
            label={`${t.result.revenueB} · ${revenueBPercent.toFixed(2)}%`}
            amount={result.revenueB}
            baseCurrency={baseCurrency}
            accent="gold"
          />
        </div>

        {/* Main table */}
        <div
          style={{
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            <thead>
              <tr style={{ background: PAPER_WARM, borderBottom: `1px solid ${LINE}` }}>
                <th
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                  }}
                >
                  {t.result.item}
                </th>
                <th
                  style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                  }}
                >
                  {t.result.amount} ({baseCurrency})
                </th>
                <th
                  style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    width: 64,
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: INK_MUTED,
                  }}
                >
                  {t.result.ratio}
                </th>
              </tr>
            </thead>
            <tbody>
              <Row
                label={t.input.balance}
                amount={result.balance}
                baseCurrency={baseCurrency}
                emphasized
                negative={result.balance < 0}
              />
              <Row
                label={`${t.input.targetA} ${t.input.balance}`}
                amount={result.balanceA}
                baseCurrency={baseCurrency}
                ratio={`${revenueAPercent.toFixed(2)}%`}
                indent
                negative={result.balanceA < 0}
              />
              <Row
                label={`${t.input.targetB} ${t.input.balance}`}
                amount={result.balanceB - result.balanceA}
                baseCurrency={baseCurrency}
                ratio={`${revenueBPercent.toFixed(2)}%`}
                indent
                negative={result.balanceB - result.balanceA < 0}
              />
              <Row
                label={t.result.buyingA}
                amount={result.buyingA}
                baseCurrency={baseCurrency}
                ratio={`${revenueAPercent.toFixed(2)}%`}
                indent
              />
              <Row
                label={t.result.buyingB}
                amount={result.buyingB}
                baseCurrency={baseCurrency}
                ratio={`${revenueBPercent.toFixed(2)}%`}
                indent
              />
              <Row
                label={t.result.returningA}
                amount={result.returningA > 0 ? -result.returningA : result.returningA}
                baseCurrency={baseCurrency}
                ratio={`${revenueAPercent.toFixed(2)}%`}
                indent
                negative={result.returningA > 0}
              />
              <Row
                label={t.result.returningB}
                amount={result.returningB > 0 ? -result.returningB : result.returningB}
                baseCurrency={baseCurrency}
                ratio={`${revenueBPercent.toFixed(2)}%`}
                indent
                negative={result.returningB > 0}
              />

              {result.rollingFees.map((rf) => (
                <Row
                  key={rf.label}
                  label={
                    <span>
                      {rollingFeeLabel(rf.label)}
                      <span style={{ marginLeft: 6, color: INK_SOFT, fontSize: 9 }}>
                        {rf.target}
                      </span>
                    </span>
                  }
                  amount={rf.amount > 0 ? -rf.amount : rf.amount}
                  baseCurrency={baseCurrency}
                  ratio={`${rf.feePercent}%`}
                  negative
                />
              ))}

              {(result.expenses.costA + result.expenses.costB) > 0 && (
                <Row
                  label={t.expenses.cost}
                  amount={-(result.expenses.costA + result.expenses.costB)}
                  baseCurrency={baseCurrency}
                  negative
                />
              )}
              {(result.expenses.tipA + result.expenses.tipB) > 0 && (
                <Row
                  label={t.expenses.tip}
                  amount={-(result.expenses.tipA + result.expenses.tipB)}
                  baseCurrency={baseCurrency}
                  negative
                />
              )}
              {(result.expenses.markA + result.expenses.markB) > 0 && (
                <Row
                  label={t.expenses.mark}
                  amount={-(result.expenses.markA + result.expenses.markB)}
                  baseCurrency={baseCurrency}
                  negative
                />
              )}
              {(result.expenses.taxA + result.expenses.taxB) > 0 && (
                <Row
                  label={
                    <span>
                      {t.expenses.tax}
                      {result.expenses.taxPercent > 0 && (
                        <span style={{ marginLeft: 6, color: INK_SOFT, fontSize: 9 }}>
                          {result.expenses.taxPercent}%
                        </span>
                      )}
                    </span>
                  }
                  amount={-(result.expenses.taxA + result.expenses.taxB)}
                  baseCurrency={baseCurrency}
                  negative
                />
              )}

              <Row
                label={t.result.revenue}
                amount={result.totalRevenue}
                baseCurrency={baseCurrency}
                emphasized
                accent="red"
                ratio="100%"
              />
              <Row
                label={t.result.revenueA}
                amount={result.revenueA}
                baseCurrency={baseCurrency}
                ratio={`${revenueAPercent.toFixed(2)}%`}
                indent
              />
              <Row
                label={t.result.revenueB}
                amount={result.revenueB}
                baseCurrency={baseCurrency}
                ratio={`${revenueBPercent.toFixed(2)}%`}
                indent
              />

              <Row
                label={t.result.distribution}
                amount={distributionTotal}
                baseCurrency={baseCurrency}
                emphasized
                accent="gold"
              />
              {result.distribution.map((d, idx) => (
                <Row
                  key={d.memberId}
                  label={d.memberName}
                  amount={d.amount}
                  baseCurrency={baseCurrency}
                  ratio={`${d.percentage.toFixed(1)}%`}
                  indent
                  last={idx === result.distribution.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 18,
            padding: 14,
            border: `1px solid ${LINE}`,
            borderRadius: 6,
            background: PAPER,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MiniDonut
              revenueA={result.revenueA}
              revenueB={result.revenueB}
              revenueAPercent={revenueAPercent}
            />
            <div
              style={{
                display: 'flex',
                gap: 10,
                fontSize: 8.5,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: RED,
                  }}
                />
                A {revenueAPercent.toFixed(2)}%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: GOLD,
                  }}
                />
                B {revenueBPercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK_MUTED,
                marginBottom: 8,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {t.result.distribution}
            </div>
            <MemberBar result={result} baseCurrency={baseCurrency} />
          </div>
        </div>

        {/* Signature / footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 18,
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: INK_SOFT,
                marginBottom: 28,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {t.header.name}
            </div>
            <div style={{ borderBottom: `1px solid ${INK}`, width: '80%' }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: INK_SOFT,
                marginBottom: 28,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {t.header.date}
            </div>
            <div style={{ borderBottom: `1px solid ${INK}`, width: '80%' }} />
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            position: 'absolute',
            left: 44,
            right: 44,
            bottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTop: `1px solid ${LINE}`,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 8.5,
              color: INK_SOFT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Generated {nowStamp}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 8.5,
              color: INK_MUTED,
            }}
          >
            <span style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              Powered by
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                fontStyle: 'italic',
                letterSpacing: '-0.01em',
                color: INK,
              }}
            >
              BEAT.GG
            </span>
          </div>
        </div>
      </div>
    );
  },
);

ExportDocument.displayName = 'ExportDocument';
