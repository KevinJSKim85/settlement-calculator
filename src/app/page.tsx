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
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-6xl">
        <header className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800">{t.app.title}</h1>
          <LanguageToggle />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <InputForm />
            <MemberManager />
            <SettingsPanel />
          </div>

          <div>
            {showDistributionWarning && !calculationResult && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
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

            <div className="mt-4">
              <ExportButtons targetRef={resultsRef} />
            </div>

            <Button variant="outline" className="mt-4 w-full" onClick={resetInputs}>
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
