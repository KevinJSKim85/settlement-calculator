import type { Currency, ExchangeRates } from '@/types';

interface HasUsableRateParams {
  amount: number;
  currency: Currency;
  baseCurrency: Currency;
  rates: ExchangeRates;
  inlineFxCurrency: Currency;
  inlineFxRate: number;
}

export function hasUsableRate({
  amount,
  currency,
  baseCurrency,
  rates,
  inlineFxCurrency,
  inlineFxRate,
}: HasUsableRateParams): boolean {
  if (amount <= 0) return true;
  if (currency === baseCurrency) return true;
  if (rates[currency] !== undefined) return true;
  if (currency === inlineFxCurrency && inlineFxRate > 0) return true;
  return false;
}
