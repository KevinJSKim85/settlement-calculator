import { Currency } from './currency';
import { DistributionMember } from './member';

export interface SettlementInput {
  buying: number;
  buyingCurrency: Currency;
  returning: number;
  returningCurrency: Currency;
  rollingA: number;
  rollingACurrency: Currency;
  rollingB: number;
  rollingBCurrency: Currency;
}

export interface SettlementConfig {
  rollingFeePercentA: number;
  rollingFeePercentB: number;
  revenueAPercent: number;
  members: DistributionMember[];
}

export interface SettlementResult {
  balance: number;
  rollingFeeA: number;
  rollingFeeB: number;
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
