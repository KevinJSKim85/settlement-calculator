import { Currency } from './currency';
import { DistributionMember } from './member';

export type RollingTarget = 'A' | 'B';

export interface RollingFeeEntry {
  amount: number;
  feePercent: number;
  target: RollingTarget;
}

export interface RollingFeeResult {
  label: string;
  amount: number;
  feePercent: number;
  target: RollingTarget;
}

export interface SettlementInput {
  buying: number;
  buyingCurrency: Currency;
  returning: number;
  returningCurrency: Currency;
  rollingEntries: RollingFeeEntry[];
}

export interface SettlementConfig {
  revenueAPercent: number;
  members: DistributionMember[];
}

export interface SettlementResult {
  balance: number;
  rollingFees: RollingFeeResult[];
  totalRevenue: number;
  revenueA: number;
  revenueB: number;
  distribution: DistributionAmount[];
  baseCurrency: Currency;
}

export interface DistributionAmount {
  memberId: string;
  memberName: string;
  percentage: number;
  withinBPercent: number;
  amount: number;
}
