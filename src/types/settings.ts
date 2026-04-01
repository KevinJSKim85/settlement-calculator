import { Currency, ExchangeRates } from './currency';
import { DistributionMember } from './member';
import { RollingTarget } from './settlement';

export type Language = 'ko' | 'zh' | 'en';

export interface RollingSetting {
  id: string;
  feePercent: number;
  target: RollingTarget;
}

export interface AppSettings {
  revenueAPercent: number;
  baseCurrency: Currency;
  members: DistributionMember[];
  manualExchangeRates: ExchangeRates;
  autoRevenueSplitFromRate: boolean;
  language: Language;
  rollingSettings: RollingSetting[];
}

export const DEFAULT_ROLLING_ID = 'rolling-default';

export const DEFAULT_SETTINGS: AppSettings = {
  revenueAPercent: 35,
  baseCurrency: 'KRW',
  members: [],
  manualExchangeRates: {},
  autoRevenueSplitFromRate: false,
  language: 'ko',
  rollingSettings: [],
};
