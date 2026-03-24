import { Currency, CURRENCIES, ExchangeRates, ExchangeRateData } from '@/types';

const FIAT_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Currency code mapping for external APIs
const FIAT_CURRENCIES: Currency[] = ['KRW', 'CNY', 'HKD', 'USD', 'JPY'];

// Map our currency codes to CoinGecko vs_currencies format
const COINGECKO_MAP: Record<string, Currency> = {
  krw: 'KRW',
  cny: 'CNY',
  hkd: 'HKD',
  usd: 'USD',
  jpy: 'JPY',
};

let cachedData: ExchangeRateData | null = null;

function isCacheValid(): boolean {
  if (!cachedData || !cachedData.fetchedAt) return false;
  return Date.now() - cachedData.fetchedAt.getTime() < CACHE_TTL_MS;
}

async function fetchFiatRates(base: Currency): Promise<ExchangeRates | null> {
  if (base === 'USDT') {
    // USDT is not a fiat currency, use USD as proxy
    return fetchFiatRates('USD');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${FIAT_API_BASE}/${base}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const rates: ExchangeRates = {};
    
    for (const currency of FIAT_CURRENCIES) {
      if (currency !== base && data.rates?.[currency] !== undefined) {
        rates[currency] = data.rates[currency];
      }
    }
    
    // Self-rate is always 1
    rates[base] = 1;
    
    return rates;
  } catch {
    return null;
  }
}

async function fetchUSDTRate(): Promise<Record<Currency, number> | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const vsCurrencies = Object.keys(COINGECKO_MAP).join(',');
    const response = await fetch(
      `${COINGECKO_API}?ids=tether&vs_currencies=${vsCurrencies}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const tether = data.tether;
    if (!tether) return null;
    
    const rates: Partial<Record<Currency, number>> = {};
    for (const [key, currency] of Object.entries(COINGECKO_MAP)) {
      if (tether[key] !== undefined) {
        rates[currency] = tether[key];
      }
    }
    
    return rates as Record<Currency, number>;
  } catch {
    return null;
  }
}

export async function fetchExchangeRates(baseCurrency: Currency): Promise<ExchangeRateData | null> {
  // Return cache if valid and same base currency
  if (isCacheValid() && cachedData?.baseCurrency === baseCurrency) {
    return cachedData;
  }
  
  const [fiatRates, usdtRates] = await Promise.all([
    fetchFiatRates(baseCurrency),
    fetchUSDTRate(),
  ]);
  
  if (!fiatRates) return null;
  
  const rates: ExchangeRates = { ...fiatRates };
  
  // Add USDT rate
  // If we have USDT→fiat rates and fiat→base rates, we can derive USDT→base
  if (usdtRates && baseCurrency !== 'USDT') {
    const usdtInBase = usdtRates[baseCurrency];
    if (usdtInBase) {
      // 1 USDT = usdtInBase units of baseCurrency
      // So to convert from base to USDT: divide by usdtInBase
      rates['USDT'] = 1 / usdtInBase;
    }
  } else if (baseCurrency === 'USDT' && usdtRates) {
    // Base is USDT, so rates are how many fiat per 1 USDT
    for (const [currency, rate] of Object.entries(usdtRates)) {
      rates[currency as Currency] = rate;
    }
    rates['USDT'] = 1;
  }
  
  const data: ExchangeRateData = {
    rates,
    baseCurrency,
    fetchedAt: new Date(),
    isManual: false,
  };
  
  cachedData = data;
  return data;
}

export function clearRateCache(): void {
  cachedData = null;
}

export function isRateStale(fetchedAt: Date | null, thresholdMinutes: number = 30): boolean {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt.getTime() > thresholdMinutes * 60 * 1000;
}

export function getMinutesSinceFetch(fetchedAt: Date | null): number | null {
  if (!fetchedAt) return null;
  return Math.floor((Date.now() - fetchedAt.getTime()) / (60 * 1000));
}
