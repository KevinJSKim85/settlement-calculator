export const CURRENCIES = ['KRW', 'CNY', 'HKD', 'USDT', 'USD', 'JPY'] as const;
export type Currency = typeof CURRENCIES[number];

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; decimals: number; name: { ko: string; zh: string } }> = {
  KRW: { symbol: '₩', decimals: 0, name: { ko: '원화', zh: '韩币' } },
  CNY: { symbol: '¥', decimals: 2, name: { ko: '위안화', zh: '人民币' } },
  HKD: { symbol: 'HK$', decimals: 2, name: { ko: '홍콩달러', zh: '港币' } },
  USDT: { symbol: '₮', decimals: 2, name: { ko: '테더', zh: '泰达币' } },
  USD: { symbol: '$', decimals: 2, name: { ko: '미화', zh: '美元' } },
  JPY: { symbol: '¥', decimals: 0, name: { ko: '엔화', zh: '日元' } },
};

export type ExchangeRates = Partial<Record<Currency, number>>;

export interface ExchangeRateData {
  rates: ExchangeRates;
  baseCurrency: Currency;
  fetchedAt: Date | null;
  apiUpdatedAt: Date | null;
  isManual: boolean;
}
