import { Currency } from './currency';
import { DistributionMember } from './member';

export interface SettlementInput {
  buying: number;
  buyingCurrency: Currency;
  returning: number;
  returningCurrency: Currency;
  rolling: number;
  rollingCurrency: Currency;
}

export interface SettlementConfig {
  rollingFeePercent: number;
  revenueAPercent: number;
  members: DistributionMember[];
}

export interface SettlementResult {
  balance: number;
  rollingFee: number;
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
  amount: number;
}
