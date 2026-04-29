'use client';

import { useMemo, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Calculator, RotateCcw, FileText } from 'lucide-react';
import { InputForm } from '@/components/InputForm';
import { ExpensePanel } from '@/components/ExpensePanel';
import { MemberManager } from '@/components/MemberManager';
import { RollingManager } from '@/components/RollingManager';
import { RateTicker } from '@/components/RateTicker';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Infographics } from '@/components/Infographics';
import { ExportDocument } from '@/components/ExportDocument';
import { ExportButtons } from '@/components/ExportButtons';
import { LanguageToggle } from '@/components/LanguageToggle';
import { I18nProvider, useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { calcSettlement, deriveRevenueAPercentFromRate } from '@/lib/calculator';
import { convertAmount } from '@/lib/currency';
import { hasUsableRate } from '@/lib/settlement-validation';
import type { RollingFeeEntry, SettlementConfig, SettlementInput } from '@/types';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="tap-reset flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand-gold sm:size-8"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  );
}

function PoweredBy() {
  return (
    <div className="flex flex-col items-center gap-3 py-10 sm:py-12">
      {/* Decorative brand divider */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-brand-gold/40" />
        <span className="size-1.5 rotate-45 bg-brand-gold/70" />
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-brand-gold/40" />
      </div>

      {/* Powered by logo */}
      <a
        href="https://beat.gg"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center gap-2.5"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70 transition-colors group-hover:text-muted-foreground">
          Powered by
        </span>
        <span className="beat-brand text-xl italic sm:text-2xl">
          BEAT.GG
        </span>
      </a>

      {/* Tagline */}
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground/50">
        Premium Settlement Infrastructure
      </p>
    </div>
  );
}

function AdBanner({ label }: { label: string }) {
  return (
    <div className="ad-slot flex items-center justify-center px-4 py-3 text-center sm:py-4">
      <span className="inline-flex items-center gap-2">
        <span className="h-px w-6 bg-current opacity-40" aria-hidden="true" />
        {label}
        <span className="h-px w-6 bg-current opacity-40" aria-hidden="true" />
      </span>
    </div>
  );
}

function HomePageContent() {
  const { t } = useTranslation();
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rollings = useSettlementStore((s) => s.rollings);
  const splitMode = useSettlementStore((s) => s.splitMode);
  const storeBuyingA = useSettlementStore((s) => s.buyingA);
  const storeBuyingB = useSettlementStore((s) => s.buyingB);
  const storeReturningA = useSettlementStore((s) => s.returningA);
  const storeReturningB = useSettlementStore((s) => s.returningB);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const baseCurrency = useSettlementStore((s) => s.baseCurrency);
  const members = useSettlementStore((s) => s.members);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const autoRevenueSplitFromRate = useSettlementStore((s) => s.autoRevenueSplitFromRate);
  const inlineFxRate = useSettlementStore((s) => s.inlineFxRate);
  const expenses = useSettlementStore((s) => s.expenses);
  const expensesEnabled = useSettlementStore((s) => s.expensesEnabled);
  const userInfo = useSettlementStore((s) => s.userInfo);
  const resetInputs = useSettlementStore((s) => s.resetInputs);

  const resultsRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const scrollToResults = useCallback(() => {
    resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const inlineFxCurrency = useSettlementStore((s) => s.inlineFxCurrency);
  const effectiveRates = useMemo(() => {
    const rates = { ...manualExchangeRates };
    // Always include inline FX rate so rolling/buying/returning in that currency can convert
    if (inlineFxRate > 0 && inlineFxCurrency !== baseCurrency) {
      rates[inlineFxCurrency] = inlineFxRate;
    }
    return rates;
  }, [manualExchangeRates, inlineFxRate, inlineFxCurrency, baseCurrency]);

  const effectiveRevenueAPercent = useMemo(() => {
    if (!autoRevenueSplitFromRate || !inlineFxRate) return revenueAPercent;
    return deriveRevenueAPercentFromRate(inlineFxRate);
  }, [autoRevenueSplitFromRate, inlineFxRate, revenueAPercent]);

  const revenueBPercent = 100 - effectiveRevenueAPercent;

  const calculationResult = useMemo(() => {
    const requiresRate = (amount: number, currency: typeof baseCurrency) => !hasUsableRate({
      amount,
      currency,
      baseCurrency,
      rates: effectiveRates,
      inlineFxCurrency,
      inlineFxRate,
    });
    if (
      requiresRate(buying.amount, buying.currency) ||
      requiresRate(returning.amount, returning.currency) ||
      rollings.some((rolling) => requiresRate(rolling.amount, rolling.currency))
    ) {
      return null;
    }

    const buyingInBase = convertAmount(
      buying.amount, buying.currency, baseCurrency, effectiveRates, baseCurrency
    );
    const returningInBase = convertAmount(
      returning.amount, returning.currency, baseCurrency, effectiveRates, baseCurrency
    );
    // In manual mode: A is KRW, B is foreign amount × inlineFxRate (0 if rate not set)
    const fxRate = inlineFxRate > 0 ? inlineFxRate : 0;
    const buyingAInBase = storeBuyingA;
    const buyingBInBase = Math.round(storeBuyingB * fxRate);
    const returningAInBase = storeReturningA;
    const returningBInBase = Math.round(storeReturningB * fxRate);

    const rollingEntries: RollingFeeEntry[] = rollings.map((r) => ({
      amount: convertAmount(r.amount, r.currency, baseCurrency, effectiveRates, baseCurrency),
      feePercent: r.feePercent,
      target: r.target,
    }));

    const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
    const normalizedMemberSum = Math.round(memberSum * 1e7) / 1e7;
    const normalizedTarget = Math.round(revenueBPercent * 1e7) / 1e7;
    // Allow tiny floating-point slack so 7-decimal user inputs sum to target without false rejections
    if (Math.abs(normalizedMemberSum - normalizedTarget) > 1e-6 || members.length === 0) return null;

    const isManual = splitMode === 'manual';
    // Transform foreign-currency expense A/B values to KRW before calculation.
    // When inlineFxRate is set, BOTH expense A and B columns store foreign amounts
    // that need conversion to the base currency (KRW) for calculator consumption.
    const expensesForCalc = (expensesEnabled && inlineFxRate > 0) ? {
      ...expenses,
      costA: Math.round(expenses.costA * inlineFxRate),
      costB: Math.round(expenses.costB * inlineFxRate),
      tipA: Math.round(expenses.tipA * inlineFxRate),
      tipB: Math.round(expenses.tipB * inlineFxRate),
      markA: Math.round(expenses.markA * inlineFxRate),
      markB: Math.round(expenses.markB * inlineFxRate),
      taxA: Math.round(expenses.taxA * inlineFxRate),
      taxB: Math.round(expenses.taxB * inlineFxRate),
    } : expenses;
      const input: SettlementInput = {
      buying: isManual ? buyingAInBase + buyingBInBase : buyingInBase,
      buyingCurrency: baseCurrency,
      returning: isManual ? returningAInBase + returningBInBase : returningInBase,
      returningCurrency: baseCurrency,
      rollingEntries,
      splitMode,
      buyingA: isManual ? buyingAInBase : undefined,
      buyingB: isManual ? buyingBInBase : undefined,
      returningA: isManual ? returningAInBase : undefined,
      returningB: isManual ? returningBInBase : undefined,
      expenses: expensesEnabled ? expensesForCalc : undefined,
    };

      const config: SettlementConfig = {
        revenueAPercent: effectiveRevenueAPercent,
        members,
      };

    return calcSettlement(input, config, baseCurrency);
  }, [
    buying,
    returning,
    rollings,
    baseCurrency,
    effectiveRates,
    effectiveRevenueAPercent,
    revenueBPercent,
    members,
    splitMode,
    storeBuyingA,
    storeBuyingB,
    storeReturningA,
    storeReturningB,
    inlineFxRate,
    inlineFxCurrency,
    expenses,
    expensesEnabled,
  ]);

  const memberPercentSum = Math.round(members.reduce((sum, m) => sum + m.percentage, 0) * 1e7) / 1e7;
  const targetPercent = Math.round(revenueBPercent * 1e7) / 1e7;
  const showDistributionWarning = memberPercentSum !== targetPercent && members.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Live rate ticker */}
      <RateTicker />
      {/* Top gradient accent line */}
      <div className="gradient-line" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between gap-3 sm:mb-10">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="logo-badge flex size-10 shrink-0 items-center justify-center rounded-xl text-brand-red sm:size-11">
              <Calculator className="size-[1.2rem] sm:size-[1.3rem]" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-[1.4rem]">
                {t.app.title}
              </h1>
              <p className="mt-0.5 truncate text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground/80 sm:text-[0.7rem]">
                {t.app.subtitle}
              </p>
            </div>
          </div>
          <div className="pill-group shrink-0">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
          {/* Left: Input */}
          <div className="space-y-5">
            <InputForm />
            <RollingManager />
            <ExpensePanel />
            <MemberManager />
          </div>

          {/* Right: Results */}
          <div ref={resultsSectionRef} className="space-y-5">
            {showDistributionWarning && !calculationResult && (
              <div className="fade-in rounded-xl border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
                {t.errors.distributionWarning} ({memberPercentSum}% / {targetPercent}%)
              </div>
            )}

             <ResultsDisplay
               result={calculationResult}
               exchangeRates={effectiveRates}
               baseCurrency={baseCurrency}
               revenueAPercent={effectiveRevenueAPercent}
             />

            {calculationResult && (
              <div className="fade-in">
                 <Infographics
                   result={calculationResult}
                   baseCurrency={baseCurrency}
                   revenueAPercent={effectiveRevenueAPercent}
                 />
              </div>
            )}

            {/* Offscreen export document — rendered in DOM so html-to-image can capture it */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -10000,
                top: 0,
                width: 794,
                pointerEvents: 'none',
              }}
            >
              <ExportDocument
                ref={resultsRef}
                result={calculationResult}
                baseCurrency={baseCurrency}
                revenueAPercent={effectiveRevenueAPercent}
                exchangeRates={effectiveRates}
                userInfo={userInfo}
                inlineFxRate={inlineFxRate}
                inlineFxCurrency={inlineFxCurrency}
              />
            </div>

            {/* Action bar — sticky on mobile for always-reachable export/reset */}
            <div className="action-bar action-bar--sticky sticky bottom-3 z-40 flex flex-col gap-2 rounded-xl p-3 backdrop-blur-md sm:static sm:flex-row sm:items-center sm:gap-3">
              <div className="flex-1">
                <ExportButtons targetRef={resultsRef} disabled={!calculationResult} />
              </div>
              <button
                type="button"
                className="reset-pill tap-reset self-center sm:self-auto"
                onClick={resetInputs}
              >
                <RotateCcw className="size-3.5" />
                {t.app.reset}
              </button>
            </div>

            <AdBanner label="AD SPACE" />
          </div>
        </div>

        {/* Footer */}
        <PoweredBy />
      </div>

      {/* Mobile floating button to scroll to results */}
      <button
        type="button"
        onClick={scrollToResults}
        aria-label={t.app.viewResults}
        className="tap-reset fixed right-5 z-50 flex items-center gap-2 rounded-full bg-brand-red px-4 py-3 text-sm font-medium text-white shadow-lg transition-all active:scale-95 lg:hidden"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <FileText className="size-4" />
        {t.app.viewResults}
      </button>
    </div>
  );
}

export default function HomePage() {
  return (
    <I18nProvider>
      <HomePageContent />
    </I18nProvider>
  );
}
