import type { Currency, DistributionAmount, RollingFeeEntry, RollingFeeResult, SettlementConfig, SettlementInput, SettlementResult } from '@/types';

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
  if (members.length === 0) {
    return [];
  }

  const distribution = members.map((member) => {
    const withinBPercent = revenueBPercent > 0
      ? Math.round((member.percentage / revenueBPercent) * 10000) / 100
      : 0;
    return {
      memberId: member.id,
      memberName: member.name,
      percentage: member.percentage,
      overallPercent: withinBPercent,
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

export function calcRollingFees(entries: RollingFeeEntry[]): RollingFeeResult[] {
  return entries.map((entry, index) => ({
    label: String.fromCharCode(65 + index),
    amount: calcRollingFee(entry.amount, entry.feePercent),
    feePercent: entry.feePercent,
    target: entry.target,
  }));
}

export function calcSettlement(
  input: SettlementInput,
  config: SettlementConfig,
  baseCurrency: Currency
): SettlementResult {
  const balance = calcBalance(input.buying, input.returning);

  const rollingFees = calcRollingFees(input.rollingEntries);

  const feeForA = rollingFees
    .filter((r) => r.target === 'A')
    .reduce((sum, r) => sum + r.amount, 0);
  const feeForB = rollingFees
    .filter((r) => r.target === 'B')
    .reduce((sum, r) => sum + r.amount, 0);

  const revenueAFromBalance = Math.round((balance * config.revenueAPercent) / 100);
  const revenueBFromBalance = balance - revenueAFromBalance;

  const revenueA = revenueAFromBalance;
  const revenueB = revenueBFromBalance;
  const totalRevenue = balance;

  const revenueBPercent = 100 - config.revenueAPercent;
  const distributionBase = revenueB - feeForB;
  const distribution = calcDistribution(distributionBase, config.members, revenueBPercent);

  return {
    balance,
    rollingFees,
    totalRevenue,
    revenueA,
    revenueB,
    distribution,
    baseCurrency,
  };
}
