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

export interface Expenses {
  costA: number;
  costB: number;
  tipA: number;
  tipB: number;
  markA: number;
  markB: number;
  taxA: number;
  taxB: number;
  taxPercent: number;
}

export const DEFAULT_EXPENSES: Expenses = {
  costA: 0, costB: 0,
  tipA: 0, tipB: 0,
  markA: 0, markB: 0,
  taxA: 0, taxB: 0,
  taxPercent: 0,
};

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
  expenses?: Expenses;
}

export interface SettlementConfig {
  revenueAPercent: number;
  members: DistributionMember[];
  applyFxRevenueBShare?: boolean;
}

export interface SettlementResult {
  balance: number;
  balanceA: number;
  balanceB: number;
  buyingA: number;
  buyingB: number;
  returningA: number;
  returningB: number;
  rollingFees: RollingFeeResult[];
  expenses: Expenses;
  expenseTotalA: number;
  expenseTotalB: number;
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
