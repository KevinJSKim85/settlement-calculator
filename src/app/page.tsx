'use client';

import { useMemo, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Calculator, RotateCcw, FileText } from 'lucide-react';
import { InputForm } from '@/components/InputForm';
import { ExpensePanel } from '@/components/ExpensePanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { MemberManager } from '@/components/MemberManager';
import { RollingManager } from '@/components/RollingManager';
import { RateTicker } from '@/components/RateTicker';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Infographics } from '@/components/Infographics';
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
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-brand-gold"
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function PoweredBy() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-muted-foreground/70">
      <span>Powered by</span>
      <a
        href="https://beat.gg"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold tracking-wide text-brand-gold/80 transition-colors hover:text-brand-gold"
      >
        BEAT.GG
      </a>
    </div>
  );
}

function AdBanner({ label }: { label: string }) {
  return (
    <div className="ad-slot flex items-center justify-center px-4 py-4 text-center">
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
    const normalizedMemberSum = Math.round(memberSum * 100) / 100;
    const normalizedTarget = Math.round(revenueBPercent * 100) / 100;
    if (normalizedMemberSum !== normalizedTarget || members.length === 0) return null;

    const isManual = splitMode === 'manual';
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
      expenses: expensesEnabled ? expenses : undefined,
    };

      const config: SettlementConfig = {
        revenueAPercent: effectiveRevenueAPercent,
        members,
        applyFxRevenueBShare: autoRevenueSplitFromRate && inlineFxRate > 0,
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
    expenses,
    expensesEnabled,
  ]);

  const memberPercentSum = Math.round(members.reduce((sum, m) => sum + m.percentage, 0) * 100) / 100;
  const targetPercent = Math.round(revenueBPercent * 100) / 100;
  const showDistributionWarning = memberPercentSum !== targetPercent && members.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Live rate ticker */}
      <RateTicker />
      {/* Top gradient accent line */}
      <div className="gradient-line" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-badge flex size-11 items-center justify-center rounded-xl text-brand-red">
              <Calculator className="size-[1.3rem]" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[1.4rem]">
                {t.app.title}
              </h1>
              <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
                {t.app.subtitle}
              </p>
            </div>
          </div>
          <div className="pill-group">
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
               ref={resultsRef}
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

            {/* Action bar — sticky on mobile for always-reachable export/reset */}
            <div className="action-bar sticky bottom-3 z-40 flex flex-col gap-2 rounded-xl p-3 backdrop-blur-md sm:static sm:flex-row sm:items-center sm:gap-3">
              <div className="flex-1">
                <ExportButtons targetRef={resultsRef} disabled={!calculationResult} />
              </div>
              <button
                type="button"
                className="reset-pill self-center sm:self-auto"
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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-brand-red px-4 py-3 text-sm font-medium text-white shadow-lg transition-all active:scale-95 lg:hidden"
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
