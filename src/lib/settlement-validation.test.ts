import { describe, expect, it } from 'vitest';

import { hasUsableRate } from './settlement-validation';

describe('hasUsableRate', () => {
  it('does not require a rate when the amount is zero', () => {
    expect(
      hasUsableRate({
        amount: 0,
        currency: 'CNY',
        baseCurrency: 'KRW',
        rates: {},
        inlineFxCurrency: 'USD',
        inlineFxRate: 1400,
      })
    ).toBe(true);
  });

  it('accepts the inline FX rate for the matching currency', () => {
    expect(
      hasUsableRate({
        amount: 100,
        currency: 'CNY',
        baseCurrency: 'KRW',
        rates: {},
        inlineFxCurrency: 'CNY',
        inlineFxRate: 200,
      })
    ).toBe(true);
  });

  it('requires a rate for non-base currencies with a positive amount', () => {
    expect(
      hasUsableRate({
        amount: 100,
        currency: 'CNY',
        baseCurrency: 'KRW',
        rates: {},
        inlineFxCurrency: 'USD',
        inlineFxRate: 1400,
      })
    ).toBe(false);
  });
});
