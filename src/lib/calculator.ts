import type { Currency, DistributionAmount, SettlementConfig, SettlementInput, SettlementResult } from '@/types';

export function calcBalance(buying: number, returning: number): number {
  return buying - returning;
}

export function calcRollingFee(rolling: number, feePercent: number): number {
  return Math.round((rolling * feePercent) / 100);
}

export function calcTotalRevenue(balance: number, rollingFee: number): number {
  return balance + rollingFee;
}

export function calcRevenueA(balance: number, aPercent: number): number {
  return Math.round((balance * aPercent) / 100);
}

export function calcRevenueB(totalRevenue: number, revenueA: number): number {
  return totalRevenue - revenueA;
}

export function calcDistribution(
  revenueB: number,
  members: { id: string; name: string; percentage: number }[]
): DistributionAmount[] {
  if (members.length === 0) {
    return [];
  }

  const distribution = members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    percentage: member.percentage,
    amount: Math.round((revenueB * member.percentage) / 100),
  }));

  const distributedSum = distribution.reduce((sum, item) => sum + item.amount, 0);
  const difference = revenueB - distributedSum;
  const lastIndex = distribution.length - 1;

  return distribution.map((item, index) =>
    index === lastIndex
      ? {
          ...item,
          amount: item.amount + difference,
        }
      : item
  );
}

export function calcSettlement(
  input: SettlementInput,
  config: SettlementConfig,
  baseCurrency: Currency
): SettlementResult {
  const balance = calcBalance(input.buying, input.returning);
  const rollingFee = calcRollingFee(input.rolling, config.rollingFeePercent);
  const totalRevenue = calcTotalRevenue(balance, rollingFee);
  const revenueA = calcRevenueA(balance, config.revenueAPercent);
  const revenueB = calcRevenueB(totalRevenue, revenueA);
  const distribution = calcDistribution(revenueB, config.members);

  return {
    balance,
    rollingFee,
    totalRevenue,
    revenueA,
    revenueB,
    distribution,
    baseCurrency,
  };
}
