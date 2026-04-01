'use client';

import { useEffect, useState } from 'react';
import { fetchExchangeRates } from '@/lib/exchange-rate';
import { CURRENCY_CONFIG } from '@/types/currency';
import type { Currency, ExchangeRates } from '@/types';

const TICKER_CURRENCIES: Currency[] = ['USD', 'CNY', 'JPY', 'HKD', 'USDT'];
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function formatRate(rate: number): string {
  if (rate >= 100) return rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return rate.toLocaleString('ko-KR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function TickerContent({ rates }: { rates: ExchangeRates }) {
  return (
    <span className="inline-flex items-center gap-6 px-4">
      {TICKER_CURRENCIES.map((currency) => {
        const rate = rates[currency];
        if (!rate) return null;
        return (
          <span key={currency} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-medium text-brand-gold/90">{currency}</span>
            <span className="text-muted-foreground">{CURRENCY_CONFIG[currency].symbol}</span>
            <span className="tabular-nums text-foreground/80">{formatRate(rate)}</span>
          </span>
        );
      })}
    </span>
  );
}

export function RateTicker() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await fetchExchangeRates('KRW');
      if (mounted && data?.rates) {
        const invertedRates: ExchangeRates = {};
        for (const currency of TICKER_CURRENCIES) {
          const rate = data.rates[currency];
          if (rate && rate > 0) {
            invertedRates[currency] = 1 / rate;
          }
        }
        setRates(invertedRates);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!rates) return null;

  return (
    <div className="relative overflow-hidden border-b border-border/30 bg-surface/60 backdrop-blur-sm">
      <div className="ticker-scroll flex">
        <TickerContent rates={rates} />
        <TickerContent rates={rates} />
        <TickerContent rates={rates} />
      </div>
    </div>
  );
}
