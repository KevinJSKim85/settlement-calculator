import { Currency, ExchangeRates } from './currency';
import { DistributionMember } from './member';

export type Language = 'ko' | 'zh' | 'en';

export interface AppSettings {
  rollingFeePercent: number;
  revenueAPercent: number;
  baseCurrency: Currency;
  members: DistributionMember[];
  manualExchangeRates: ExchangeRates;
  language: Language;
}

export const DEFAULT_SETTINGS: AppSettings = {
  rollingFeePercent: 1.6,
  revenueAPercent: 35,
  baseCurrency: 'KRW',
  members: [],
  manualExchangeRates: {},
  language: 'ko',
};
