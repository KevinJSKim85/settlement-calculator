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

  if (revenueBPercent <= 0) {
    return members.map((member) => ({
      memberId: member.id,
      memberName: member.name,
      percentage: member.percentage,
      overallPercent: 0,
      amount: 0,
    }));
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
  const isManual = input.splitMode === 'manual';
  const buyingA = isManual && input.buyingA !== undefined
    ? input.buyingA
    : Math.round((input.buying * config.revenueAPercent) / 100);
  const buyingB = isManual && input.buyingB !== undefined
    ? input.buyingB
    : input.buying - buyingA;
  const returningA = isManual && input.returningA !== undefined
    ? input.returningA
    : Math.round((input.returning * config.revenueAPercent) / 100);
  const returningB = isManual && input.returningB !== undefined
    ? input.returningB
    : input.returning - returningA;
  const balance = calcBalance(
    isManual ? buyingA + buyingB : input.buying,
    isManual ? returningA + returningB : input.returning
  );

  const rollingFees = calcRollingFees(input.rollingEntries);

  const feeForA = rollingFees
    .filter((r) => r.target === 'A')
    .reduce((sum, r) => sum + r.amount, 0);
  const feeForB = rollingFees
    .filter((r) => r.target === 'B')
    .reduce((sum, r) => sum + r.amount, 0);

  const revenueAFromBalance = buyingA - returningA;
  const revenueBFromBalance = buyingB - returningB;

  const revenueA = revenueAFromBalance - feeForA;
  const revenueB = revenueBFromBalance - feeForB;
  const totalRevenue = balance;

  const revenueBPercent = 100 - config.revenueAPercent;
  const distributionBase = revenueB;
  const distribution = calcDistribution(distributionBase, config.members, revenueBPercent);

  return {
    balance,
    buyingA,
    buyingB,
    returningA,
    returningB,
    rollingFees,
    totalRevenue,
    revenueA,
    revenueB,
    distribution,
    baseCurrency,
  };
}
