import { describe, expect, it } from 'vitest';

import {
  calcBalance,
  calcDistribution,
  calcRollingFee,
  calcSettlement,
  deriveRevenueAPercentFromRate,
} from './calculator';

describe('calcBalance', () => {
  it('returns buying minus returning', () => {
    expect(calcBalance(20000000, 15000000)).toBe(5000000);
    expect(calcBalance(10000000, 18850000)).toBe(-8850000);
    expect(calcBalance(0, 0)).toBe(0);
  });
});

describe('calcRollingFee', () => {
  it('calculates rolling fee', () => {
    expect(calcRollingFee(52200000, 1.6)).toBe(835200);
    expect(calcRollingFee(52200000, 0)).toBe(0);
    expect(calcRollingFee(0, 1.6)).toBe(0);
  });
});

describe('calcDistribution', () => {
  it('keeps sum equal to revenueB when B ratio is 100%', () => {
    const distribution = calcDistribution(
      6587700,
      [
        { id: 'a', name: 'A', percentage: 15.38 },
        { id: 'b', name: 'B', percentage: 23.08 },
        { id: 'c', name: 'C', percentage: 61.54 },
      ],
      100
    );

    const sum = distribution.reduce((acc, item) => acc + item.amount, 0);
    expect(sum).toBe(6587700);
  });

  it('gives full amount to a single 100% member', () => {
    const distribution = calcDistribution(
      6587700,
      [{ id: 'only', name: 'Only', percentage: 100 }],
      100
    );

    expect(distribution).toHaveLength(1);
    expect(distribution[0]?.amount).toBe(6587700);
  });

  it('returns zero amounts when revenueBPercent is 0', () => {
    const distribution = calcDistribution(
      0,
      [{ id: 'm1', name: '멤버 1', percentage: 0 }],
      0
    );

    expect(distribution).toHaveLength(1);
    expect(distribution[0]?.amount).toBe(0);
    expect(distribution[0]?.overallPercent).toBe(0);
  });
});

describe('calcSettlement', () => {
  it('applies rolling fee to target A when A is 100%', () => {
    const result = calcSettlement(
      {
        buying: 135266,
        buyingCurrency: 'KRW',
        returning: 0,
        returningCurrency: 'KRW',
        rollingEntries: [{ amount: 12532, feePercent: 100, target: 'A' }],
      },
      {
        revenueAPercent: 100,
        members: [{ id: 'm1', name: '멤버 1', percentage: 0 }],
      },
      'KRW'
    );

    expect(result.balance).toBe(135266);
    expect(result.balanceA).toBe(135266);
    expect(result.balanceB).toBe(0);
    expect(result.revenueA).toBe(122734);
    expect(result.revenueB).toBe(0);
    expect(result.distribution[0]?.amount).toBe(0);
  });

  it('applies rolling fee to target B when B is 100%', () => {
    const result = calcSettlement(
      {
        buying: 135266,
        buyingCurrency: 'KRW',
        returning: 0,
        returningCurrency: 'KRW',
        rollingEntries: [{ amount: 12532, feePercent: 100, target: 'B' }],
      },
      {
        revenueAPercent: 0,
        members: [{ id: 'm1', name: '멤버 1', percentage: 100 }],
      },
      'KRW'
    );

    expect(result.balance).toBe(135266);
    expect(result.balanceA).toBe(0);
    expect(result.balanceB).toBe(135266);
    expect(result.revenueA).toBe(0);
    expect(result.revenueB).toBe(122734);
    expect(result.distribution[0]?.amount).toBe(122734);
  });

  it('returns A/B split buying and returning amounts', () => {
    const result = calcSettlement(
      {
        buying: 100,
        buyingCurrency: 'KRW',
        returning: 40,
        returningCurrency: 'KRW',
        rollingEntries: [],
      },
      {
        revenueAPercent: 35,
        members: [{ id: 'm1', name: '멤버 1', percentage: 65 }],
      },
      'KRW'
    );

    expect(result.buyingA).toBe(35);
    expect(result.buyingB).toBe(65);
    expect(result.returningA).toBe(14);
    expect(result.returningB).toBe(26);
    expect(result.balanceA).toBe(21);
    expect(result.balanceB).toBe(39);
    expect(result.revenueA).toBe(21);
    expect(result.revenueB).toBe(39);
  });

  it('uses manual A/B inputs when split mode is manual', () => {
    const result = calcSettlement(
      {
        buying: 100,
        buyingCurrency: 'KRW',
        returning: 45,
        returningCurrency: 'KRW',
        rollingEntries: [],
        splitMode: 'manual',
        buyingA: 20,
        buyingB: 80,
        returningA: 5,
        returningB: 40,
      },
      {
        revenueAPercent: 35,
        members: [{ id: 'm1', name: '멤버 1', percentage: 65 }],
      },
      'KRW'
    );

    expect(result.buyingA).toBe(20);
    expect(result.buyingB).toBe(80);
    expect(result.returningA).toBe(5);
    expect(result.returningB).toBe(40);
    expect(result.balanceA).toBe(15);
    expect(result.balanceB).toBe(40);
    expect(result.revenueA).toBe(15);
    expect(result.revenueB).toBe(40);
  });

  it('derives revenue B from the B ratio when FX revenue sharing is enabled', () => {
    const result = calcSettlement(
      {
        buying: 1000,
        buyingCurrency: 'KRW',
        returning: 0,
        returningCurrency: 'KRW',
        splitMode: 'manual',
        buyingA: 200,
        buyingB: 800,
        returningA: 0,
        returningB: 300,
        rollingEntries: [{ amount: 100, feePercent: 10, target: 'B' }],
      },
      {
        revenueAPercent: 40,
        members: [{ id: 'm1', name: '멤버 1', percentage: 60 }],
        applyFxRevenueBShare: true,
      },
      'KRW'
    );

    // revenueB applies B-share (500 × 60%) minus feeForB (10) = 290
    expect(result.revenueB).toBe(290);
    expect(result.distribution[0]?.amount).toBe(290);
    expect(result.balanceA).toBe(200);
    expect(result.balanceB).toBe(500);
    // revenueA is always direct: balanceA − feeForA − expenseTotalA = 200 − 0 − 0 = 200
    expect(result.revenueA).toBe(200);
    // totalRevenue now = revenueA + revenueB (independent sums, not balance-minus-fees)
    expect(result.totalRevenue).toBe(490);
  });
});

describe('deriveRevenueAPercentFromRate', () => {
  it('derives revenue A percent from exchange rate (full precision)', () => {
    // 100 / 211 * 100 = 47.393364928909955... (unrounded for Excel parity)
    expect(deriveRevenueAPercentFromRate(211)).toBeCloseTo(47.3933649289, 9);
  });
});
