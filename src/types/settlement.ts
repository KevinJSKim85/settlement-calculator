import type { Currency } from './currency';
import type { DistributionMember } from './member';

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

export type SplitMode = 'auto' | 'manual';

export interface SettlementInput {
  buying: number;
  buyingCurrency: Currency;
  returning: number;
  returningCurrency: Currency;
  rollingEntries: RollingFeeEntry[];
  splitMode?: SplitMode;
  buyingA?: number;
  buyingB?: number;
  returningA?: number;
  returningB?: number;
}

export interface SettlementConfig {
  revenueAPercent: number;
  members: DistributionMember[];
}

export interface SettlementResult {
  balance: number;
  buyingA: number;
  buyingB: number;
  returningA: number;
  returningB: number;
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
  overallPercent: number;
  amount: number;
}
