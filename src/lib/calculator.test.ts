import { describe, expect, it } from 'vitest';

import {
  calcBalance,
  calcDistribution,
  calcRevenueA,
  calcRevenueB,
  calcRollingFee,
  calcSettlement,
  calcTotalRevenue,
} from './calculator';

describe('calcBalance', () => {
  it('returns positive balance for normal case', () => {
    expect(calcBalance(10000000, 18850000)).toBe(8850000);
  });

  it('returns negative balance when returning is smaller', () => {
    expect(calcBalance(20000000, 15000000)).toBe(-5000000);
  });

  it('returns zero when both are zero', () => {
    expect(calcBalance(0, 0)).toBe(0);
  });
});

describe('calcRollingFee', () => {
  it('calculates rolling fee for normal case', () => {
    expect(calcRollingFee(52200000, 1.6)).toBe(835200);
  });

  it('returns zero for zero percent', () => {
    expect(calcRollingFee(52200000, 0)).toBe(0);
  });

  it('returns zero for zero rolling', () => {
    expect(calcRollingFee(0, 1.6)).toBe(0);
  });
});

describe('calcTotalRevenue', () => {
  it('calculates total revenue for normal case', () => {
    expect(calcTotalRevenue(8850000, 835200)).toBe(9685200);
  });

  it('supports negative balance', () => {
    expect(calcTotalRevenue(-5000000, 835200)).toBe(-4164800);
  });
});

describe('calcRevenueA', () => {
  it('calculates revenueA for normal case', () => {
    expect(calcRevenueA(8850000, 35)).toBe(3097500);
  });

  it('supports negative balance', () => {
    expect(calcRevenueA(-5000000, 35)).toBe(-1750000);
  });

  it('returns zero for zero percent', () => {
    expect(calcRevenueA(8850000, 0)).toBe(0);
  });

  it('returns full balance for 100 percent', () => {
    expect(calcRevenueA(8850000, 100)).toBe(8850000);
  });
});

describe('calcRevenueB', () => {
  it('calculates revenueB for normal case', () => {
    expect(calcRevenueB(9685200, 3097500)).toBe(6587700);
  });
});

describe('calcDistribution', () => {
  it('keeps sum equal to revenueB for [15.38, 23.08, 61.54]', () => {
    const distribution = calcDistribution(6587700, [
      { id: 'a', name: 'A', percentage: 15.38 },
      { id: 'b', name: 'B', percentage: 23.08 },
      { id: 'c', name: 'C', percentage: 61.54 },
    ]);

    const sum = distribution.reduce((acc, item) => acc + item.amount, 0);
    expect(sum).toBe(6587700);
  });

  it('gives full amount to a single 100% member', () => {
    const distribution = calcDistribution(6587700, [{ id: 'only', name: 'Only', percentage: 100 }]);

    expect(distribution).toHaveLength(1);
    expect(distribution[0]?.amount).toBe(6587700);
  });

  it('keeps exact sum for [33.33, 33.33, 33.34] edge case', () => {
    const distribution = calcDistribution(100, [
      { id: 'a', name: 'A', percentage: 33.33 },
      { id: 'b', name: 'B', percentage: 33.33 },
      { id: 'c', name: 'C', percentage: 33.34 },
    ]);

    const sum = distribution.reduce((acc, item) => acc + item.amount, 0);
    expect(sum).toBe(100);
  });
});

describe('calcSettlement', () => {
  it('calculates full settlement pipeline from test vector', () => {
    const result = calcSettlement(
      {
        buying: 10000000,
        buyingCurrency: 'KRW',
        returning: 18850000,
        returningCurrency: 'KRW',
        rolling: 52200000,
        rollingCurrency: 'KRW',
      },
      {
        rollingFeePercent: 1.6,
        revenueAPercent: 35,
        members: [
          { id: 'a', name: 'A', percentage: 15.38 },
          { id: 'b', name: 'B', percentage: 23.08 },
          { id: 'c', name: 'C', percentage: 61.54 },
        ],
      },
      'KRW'
    );

    expect(result.balance).toBe(8850000);
    expect(result.rollingFee).toBe(835200);
    expect(result.totalRevenue).toBe(9685200);
    expect(result.revenueA).toBe(3097500);
    expect(result.revenueB).toBe(6587700);
  });
});
