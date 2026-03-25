'use client';

import { useMemo, useRef } from 'react';
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

function HomePageContent() {
  const { t } = useTranslation();
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rolling = useSettlementStore((s) => s.rolling);
  const rollingFeePercent = useSettlementStore((s) => s.rollingFeePercent);
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
    const rollingInBase = convertAmount(
      rolling.amount,
      rolling.currency,
      baseCurrency,
      effectiveRates,
      baseCurrency
    );

    const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
    const normalizedMemberSum = Math.round(memberSum * 100) / 100;
    if (normalizedMemberSum !== 100 || members.length === 0) return null;

    const input: SettlementInput = {
      buying: buyingInBase,
      buyingCurrency: baseCurrency,
      returning: returningInBase,
      returningCurrency: baseCurrency,
      rolling: rollingInBase,
      rollingCurrency: baseCurrency,
    };

    const config: SettlementConfig = {
      rollingFeePercent,
      revenueAPercent,
      members,
    };

    return calcSettlement(input, config, baseCurrency);
  }, [
    buying,
    returning,
    rolling,
    baseCurrency,
    effectiveRates,
    rollingFeePercent,
    revenueAPercent,
    members,
  ]);

  const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
  const normalizedMemberSum = Math.round(memberSum * 100) / 100;
  const showDistributionWarning = normalizedMemberSum !== 100 && members.length > 0;

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
          <LanguageToggle />
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
                분배 비율 합계가 100%가 아닙니다 ({normalizedMemberSum}%)
              </div>
            )}

            <ResultsDisplay
              ref={resultsRef}
              result={calculationResult}
              exchangeRates={effectiveRates}
              baseCurrency={baseCurrency}
              rollingFeePercent={rollingFeePercent}
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
