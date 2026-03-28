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
import type { RollingFeeEntry, SettlementConfig, SettlementInput } from '@/types';

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

function AdBanner({ href, label, primary = false }: { href?: string; label: string; primary?: boolean }) {
  const content = (
    <div
      className={[
        'flex items-center justify-center rounded-lg border px-4 py-3 text-center text-sm font-bold tracking-wide transition-colors',
        primary
          ? 'border-foreground/20 bg-foreground text-background hover:opacity-90'
          : 'border-border/60 bg-surface text-muted-foreground/40',
      ].join(' ')}
    >
      {label}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

function HomePageContent() {
  const { t } = useTranslation();
  const buying = useSettlementStore((s) => s.buying);
  const returning = useSettlementStore((s) => s.returning);
  const rollings = useSettlementStore((s) => s.rollings);
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
      buying.amount, buying.currency, baseCurrency, effectiveRates, baseCurrency
    );
    const returningInBase = convertAmount(
      returning.amount, returning.currency, baseCurrency, effectiveRates, baseCurrency
    );

    const rollingEntries: RollingFeeEntry[] = rollings.map((r) => ({
      amount: convertAmount(r.amount, r.currency, baseCurrency, effectiveRates, baseCurrency),
      feePercent: r.feePercent,
      target: r.target,
    }));

    const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
    const normalizedMemberSum = Math.round(memberSum * 100) / 100;
    const normalizedTarget = Math.round(revenueBPercent * 100) / 100;
    if (normalizedMemberSum !== normalizedTarget || members.length === 0) return null;

    const input: SettlementInput = {
      buying: buyingInBase,
      buyingCurrency: baseCurrency,
      returning: returningInBase,
      returningCurrency: baseCurrency,
      rollingEntries,
    };

    const config: SettlementConfig = {
      revenueAPercent,
      members,
    };

    return calcSettlement(input, config, baseCurrency);
  }, [
    buying,
    returning,
    rollings,
    baseCurrency,
    effectiveRates,
    revenueAPercent,
    revenueBPercent,
    members,
  ]);

  const memberSum = members.reduce((sum, m) => sum + m.percentage, 0);
  const normalizedMemberSum = Math.round(memberSum * 100) / 100;
  const normalizedTarget2 = Math.round(revenueBPercent * 100) / 100;
  const showDistributionWarning = normalizedMemberSum !== normalizedTarget2 && members.length > 0;

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

        <AdBanner href="https://beat.gg" label="BEAT.GG" primary />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-5">
            <InputForm />
            <AdBanner label="AD SPACE" />
            <MemberManager />
            <SettingsPanel />
          </div>

          <div className="space-y-5">
            {showDistributionWarning && !calculationResult && (
              <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-red-400">
                {t.errors.distributionWarning} ({normalizedMemberSum}% / {normalizedTarget2}%)
              </div>
            )}

            <ResultsDisplay
              ref={resultsRef}
              result={calculationResult}
              exchangeRates={effectiveRates}
              baseCurrency={baseCurrency}
              revenueAPercent={revenueAPercent}
            />

            <ExportButtons targetRef={resultsRef} disabled={!calculationResult} />

            <Button
              variant="outline"
              className="w-full border-border/60 text-muted-foreground transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
              onClick={resetInputs}
            >
              {t.app.reset}
            </Button>

            <AdBanner label="AD SPACE" />
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
