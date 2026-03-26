'use client';

import { useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { InputForm } from '@/components/InputForm';
import { SettingsPanel } from '@/components/SettingsPanel';
import { MemberManager } from '@/components/MemberManager';
import ResultsDisplay from '@/components/ResultsDisplay';
import { ExportButtons } from '@/components/ExportButtons';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { I18nProvider, useTranslation } from '@/i18n';
import { useSettlementStore } from '@/lib/store';
import { calcSettlement } from '@/lib/calculator';
import { convertAmount } from '@/lib/currency';
import type { SettlementConfig, SettlementInput } from '@/types';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="border-border/60 text-muted-foreground transition-colors hover:text-brand-gold"
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function HomePageContent() {
  const { t } = useTranslation();
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rollingA = useSettlementStore((s) => s.rollingA);
  const rollingB = useSettlementStore((s) => s.rollingB);
  const rollingFeePercentA = useSettlementStore((s) => s.rollingFeePercentA);
  const rollingFeePercentB = useSettlementStore((s) => s.rollingFeePercentB);
  const revenueAPercent = useSettlementStore((s) => s.revenueAPercent);
  const baseCurrency = useSettlementStore((s) => s.baseCurrency);
  const members = useSettlementStore((s) => s.members);
  const exchangeRateData = useSettlementStore((s) => s.exchangeRateData);
  const manualExchangeRates = useSettlementStore((s) => s.manualExchangeRates);
  const resetInputs = useSettlementStore((s) => s.resetInputs);

  const resultsRef = useRef<HTMLDivElement>(null);

  const effectiveRates = useMemo(() => {
    const apiRates = exchangeRateData?.rates || {};
    return { ...apiRates, ...manualExchangeRates };
  }, [exchangeRateData, manualExchangeRates]);

  const revenueBPercent = 100 - revenueAPercent;

  const calculationResult = useMemo(() => {
    const buyingInBase = convertAmount(
      buying.amount,
      buying.currency,
      baseCurrency,
      effectiveRates,
      baseCurrency
    );
    const returningInBase = convertAmount(
      returning.amount,
      returning.currency,
      baseCurrency,
      effectiveRates,
      baseCurrency
    );
    const rollingAInBase = convertAmount(
      rollingA.amount,
      rollingA.currency,
      baseCurrency,
      effectiveRates,
      baseCurrency
    );
    const rollingBInBase = convertAmount(
      rollingB.amount,
      rollingB.currency,
      baseCurrency,
      effectiveRates,
      baseCurrency
    );

    const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
    const normalizedMemberSum = Math.round(memberSum * 100) / 100;
    const normalizedTarget = Math.round(revenueBPercent * 100) / 100;
    if (normalizedMemberSum !== normalizedTarget || members.length === 0) return null;

    const input: SettlementInput = {
      buying: buyingInBase,
      buyingCurrency: baseCurrency,
      returning: returningInBase,
      returningCurrency: baseCurrency,
      rollingA: rollingAInBase,
      rollingACurrency: baseCurrency,
      rollingB: rollingBInBase,
      rollingBCurrency: baseCurrency,
    };

    const config: SettlementConfig = {
      rollingFeePercentA,
      rollingFeePercentB,
      revenueAPercent,
      members,
    };

    return calcSettlement(input, config, baseCurrency);
  }, [
    buying,
    returning,
    rollingA,
    rollingB,
    baseCurrency,
    effectiveRates,
    rollingFeePercentA,
    rollingFeePercentB,
    revenueAPercent,
    revenueBPercent,
    members,
  ]);

  const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
  const normalizedMemberSum = Math.round(memberSum * 100) / 100;
  const normalizedTarget = Math.round(revenueBPercent * 100) / 100;
  const showDistributionWarning = normalizedMemberSum !== normalizedTarget && members.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-gold sm:text-3xl">
              {t.app.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.app.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-5">
            <InputForm />
            <MemberManager />
            <SettingsPanel />
          </div>

          <div className="space-y-5">
            {showDistributionWarning && !calculationResult && (
              <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-red-400">
                {t.errors.distributionWarning} ({normalizedMemberSum}% / {normalizedTarget}%)
              </div>
            )}

            <ResultsDisplay
              ref={resultsRef}
              result={calculationResult}
              exchangeRates={effectiveRates}
              baseCurrency={baseCurrency}
              rollingFeePercentA={rollingFeePercentA}
              rollingFeePercentB={rollingFeePercentB}
              revenueAPercent={revenueAPercent}
            />

            <ExportButtons targetRef={resultsRef} />

            <Button
              variant="outline"
              className="w-full border-border/60 text-muted-foreground transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
              onClick={resetInputs}
            >
              {t.app.reset}
            </Button>
          </div>
        </div>
      </div>
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
