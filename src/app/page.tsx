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
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border/40 bg-surface/50 px-4 py-3 text-center text-xs text-muted-foreground/50">
      {label}
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
    // In manual mode: A is KRW, B is foreign amount × inlineFxRate
    const fxRate = inlineFxRate || 1;
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
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
              <Calculator className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t.app.title}
              </h1>
              <p className="text-xs text-muted-foreground">{t.app.subtitle}</p>
            </div>
          </div>
          <div className="pill-group">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
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

            {/* Action bar */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-card/50 p-3 backdrop-blur-sm sm:flex-row sm:items-center">
              <div className="flex-1">
                <ExportButtons targetRef={resultsRef} disabled={!calculationResult} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground transition-colors hover:text-brand-red"
                onClick={resetInputs}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                {t.app.reset}
              </Button>
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
