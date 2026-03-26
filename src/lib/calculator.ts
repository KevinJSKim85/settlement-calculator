import type { Currency, DistributionAmount, SettlementConfig, SettlementInput, SettlementResult } from '@/types';

export function calcBalance(buying: number, returning: number): number {
  return buying - returning;
}

export function calcRollingFee(rolling: number, feePercent: number): number {
  return Math.round((rolling * feePercent) / 100);
}

export function calcDistribution(
  revenueB: number,
  members: { id: string; name: string; percentage: number }[],
  revenueBPercent: number
): DistributionAmount[] {
  if (members.length === 0 || revenueBPercent <= 0) {
    return [];
  }

  const distribution = members.map((member) => {
    const withinBPercent = (member.percentage / revenueBPercent) * 100;
    return {
      memberId: member.id,
      memberName: member.name,
      percentage: member.percentage,
      withinBPercent,
      amount: Math.round((revenueB * member.percentage) / revenueBPercent),
    };
  });

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
  const rollingFeeA = calcRollingFee(input.rollingA, config.rollingFeePercentA);
  const rollingFeeB = calcRollingFee(input.rollingB, config.rollingFeePercentB);

  const revenueAFromBalance = Math.round((balance * config.revenueAPercent) / 100);
  const revenueBFromBalance = balance - revenueAFromBalance;

  const revenueA = revenueAFromBalance + rollingFeeA;
  const revenueB = revenueBFromBalance + rollingFeeB;
  const totalRevenue = revenueA + revenueB;

  const revenueBPercent = 100 - config.revenueAPercent;
  const distribution = calcDistribution(revenueB, config.members, revenueBPercent);

  return {
    balance,
    rollingFeeA,
    rollingFeeB,
    totalRevenue,
    revenueA,
    revenueB,
    distribution,
    baseCurrency,
  };
}
