import type { Currency, DistributionAmount, RollingFeeEntry, RollingFeeResult, SettlementConfig, SettlementInput, SettlementResult } from '@/types';
import { DEFAULT_EXPENSES } from '@/types';

export function deriveRevenueAPercentFromRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  // Full JS-float precision. Display code rounds for the label but the
  // underlying calc keeps the exact value (matches Excel's 100-100/rate*100).
  return Math.max(0, Math.min(100, (100 / rate) * 100));
}

export function calcBalance(buying: number, returning: number): number {
  return buying - returning;
}

export function calcSplitBalance(balanceA: number, balanceB: number): number {
  return balanceA + balanceB;
}

export function calcManualBalanceB(rawBalanceA: number, rawBalanceB: number): number {
  return rawBalanceB - rawBalanceA;
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
    sourceAmount: entry.amount,
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
  const rawBalanceA = calcBalance(buyingA, returningA);
  const rawBalanceB = calcBalance(buyingB, returningB);
  const balanceA = rawBalanceA;
  const balanceB = isManual
    ? calcManualBalanceB(rawBalanceA, rawBalanceB)
    : rawBalanceB;
  const balance = isManual
    ? calcSplitBalance(balanceA, balanceB)
    : calcBalance(input.buying, input.returning);

  const rollingFees = calcRollingFees(input.rollingEntries);

  const feeForA = rollingFees
    .filter((r) => r.target === 'A')
    .reduce((sum, r) => sum + r.amount, 0);
  const feeForB = rollingFees
    .filter((r) => r.target === 'B')
    .reduce((sum, r) => sum + r.amount, 0);

  const expenses = input.expenses ?? { ...DEFAULT_EXPENSES };
  const expenseTotalA = expenses.costA + expenses.tipA + expenses.markA + expenses.taxA;
  const expenseTotalB = expenses.costB + expenses.tipB + expenses.markB + expenses.taxB;

  const revenueAFromBalance = balanceA;
  const revenueBFromBalance = balanceB;
  const revenueBPercent = 100 - config.revenueAPercent;

  // Revenue A is always direct: (buyingA - returningA) - feeForA - expenseTotalA
  // (independent of FX / revenueA%)
  const revenueA = revenueAFromBalance - feeForA - expenseTotalA;
  const revenueB = revenueBFromBalance - feeForB - expenseTotalB;
  const totalRevenue = revenueA + revenueB;

  const distributionBase = revenueB;
  const distribution = calcDistribution(distributionBase, config.members, revenueBPercent);

  return {
    splitMode: isManual ? 'manual' : 'auto',
    balance,
    balanceA,
    balanceB,
    buyingA,
    buyingB,
    returningA,
    returningB,
    rollingFees,
    expenses,
    expenseTotalA,
    expenseTotalB,
    totalRevenue,
    revenueA,
    revenueB,
    distribution,
    baseCurrency,
  };
}
