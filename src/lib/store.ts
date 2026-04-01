'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Currency, ExchangeRateData, ExchangeRates, DistributionMember, RollingTarget, SplitMode } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import type { Language } from '@/types';

interface InputField {
  amount: number;
  currency: Currency;
}

export interface RollingEntry {
  id: string;
  amount: number;
  currency: Currency;
  feePercent: number;
  target: RollingTarget;
}

const MAX_ROLLINGS = 3;

function makeRollingId(): string {
  return `rolling-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export interface SettlementStore {
  revenueAPercent: number;
  baseCurrency: Currency;
  members: DistributionMember[];
  manualExchangeRates: ExchangeRates;
  autoRevenueSplitFromRate: boolean;
  language: Language;

  buying: InputField;
  returning: InputField;
  rollings: RollingEntry[];
  splitMode: SplitMode;
  buyingA: number;
  buyingB: number;
  returningA: number;
  returningB: number;
  inlineFxRate: number;
  inlineFxCurrency: Currency;
  inlineForeignAmount: number;
  inlineRetForeignAmount: number;

  exchangeRateData: ExchangeRateData | null;

  setRevenueAPercent: (percent: number) => void;
  setBaseCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  setAutoRevenueSplitFromRate: (enabled: boolean) => void;
  setManualExchangeRate: (currency: Currency, rate: number) => void;
  clearManualExchangeRate: (currency: Currency) => void;

  addMember: (name: string, percentage: number) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<Pick<DistributionMember, 'name' | 'percentage'>>) => void;

  setSplitMode: (mode: SplitMode) => void;
  setBuying: (amount: number) => void;
  setBuyingCurrency: (currency: Currency) => void;
  setReturning: (amount: number) => void;
  setReturningCurrency: (currency: Currency) => void;
  setBuyingA: (amount: number) => void;
  setBuyingB: (amount: number) => void;
  setReturningA: (amount: number) => void;
  setReturningB: (amount: number) => void;
  setInlineFxRate: (rate: number) => void;
  setInlineFxCurrency: (currency: Currency) => void;
  setInlineForeignAmount: (amount: number) => void;
  setInlineRetForeignAmount: (amount: number) => void;

  addRolling: () => void;
  removeRolling: (id: string) => void;
  setRollingAmount: (id: string, amount: number) => void;
  setRollingCurrency: (id: string, currency: Currency) => void;
  setRollingFeePercent: (id: string, feePercent: number) => void;
  setRollingTarget: (id: string, target: RollingTarget) => void;

  setExchangeRateData: (data: ExchangeRateData | null) => void;

  resetInputs: () => void;
  getMemberPercentageSum: () => number;
}

export const useSettlementStore = create<SettlementStore>()(
  persist(
    (set, get) => ({
      revenueAPercent: DEFAULT_SETTINGS.revenueAPercent,
      baseCurrency: DEFAULT_SETTINGS.baseCurrency,
      members: DEFAULT_SETTINGS.members,
      manualExchangeRates: DEFAULT_SETTINGS.manualExchangeRates,
      autoRevenueSplitFromRate: DEFAULT_SETTINGS.autoRevenueSplitFromRate,
      language: DEFAULT_SETTINGS.language,

      buying: { amount: 0, currency: DEFAULT_SETTINGS.baseCurrency },
      returning: { amount: 0, currency: DEFAULT_SETTINGS.baseCurrency },
      splitMode: 'auto' as SplitMode,
      buyingA: 0,
      buyingB: 0,
      returningA: 0,
      returningB: 0,
      inlineFxRate: 0,
      inlineFxCurrency: 'CNY' as Currency,
      inlineForeignAmount: 0,
      inlineRetForeignAmount: 0,
      rollings: DEFAULT_SETTINGS.rollingSettings.map((s) => ({
        ...s,
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      })),

      exchangeRateData: null,

      setRevenueAPercent: (percent: number) =>
        set({ revenueAPercent: percent }),

      setBaseCurrency: (currency: Currency) =>
        set({ baseCurrency: currency }),

      setLanguage: (language: Language) =>
        set({ language }),

      setAutoRevenueSplitFromRate: (enabled: boolean) =>
        set({ autoRevenueSplitFromRate: enabled }),

      setManualExchangeRate: (currency: Currency, rate: number) =>
        set((state: SettlementStore) => ({
          manualExchangeRates: {
            ...state.manualExchangeRates,
            [currency]: rate,
          },
        })),

      clearManualExchangeRate: (currency: Currency) =>
        set((state: SettlementStore) => {
          const { [currency]: _, ...rest } = state.manualExchangeRates;
          return { manualExchangeRates: rest };
        }),

      addMember: (name: string, percentage: number) =>
        set((state: SettlementStore) => {
          if (state.members.length >= 10) return state;
          const newMember: DistributionMember = {
            id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            percentage,
          };
          return { members: [...state.members, newMember] };
        }),

      removeMember: (id: string) =>
        set((state: SettlementStore) => {
          if (state.members.length <= 1) return state;
          return { members: state.members.filter((m) => m.id !== id) };
        }),

      updateMember: (id: string, updates: Partial<Pick<DistributionMember, 'name' | 'percentage'>>) =>
        set((state: SettlementStore) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      setSplitMode: (mode: SplitMode) =>
        set({ splitMode: mode }),

      setBuying: (amount: number) =>
        set((state: SettlementStore) => ({ buying: { ...state.buying, amount } })),

      setBuyingCurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({ buying: { ...state.buying, currency } })),

      setReturning: (amount: number) =>
        set((state: SettlementStore) => ({ returning: { ...state.returning, amount } })),

      setReturningCurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({ returning: { ...state.returning, currency } })),

      setBuyingA: (amount: number) => set({ buyingA: amount }),
      setBuyingB: (amount: number) => set({ buyingB: amount }),
      setReturningA: (amount: number) => set({ returningA: amount }),
      setReturningB: (amount: number) => set({ returningB: amount }),

      setInlineFxRate: (rate: number) => set({ inlineFxRate: rate }),
      setInlineFxCurrency: (currency: Currency) => set({ inlineFxCurrency: currency }),
      setInlineForeignAmount: (amount: number) => set({ inlineForeignAmount: amount }),
      setInlineRetForeignAmount: (amount: number) => set({ inlineRetForeignAmount: amount }),

      addRolling: () =>
        set((state: SettlementStore) => {
          if (state.rollings.length >= MAX_ROLLINGS) return state;
          const newEntry: RollingEntry = {
            id: makeRollingId(),
            amount: 0,
            currency: state.baseCurrency,
            feePercent: 1.6,
            target: 'B',
          };
          return { rollings: [...state.rollings, newEntry] };
        }),

      removeRolling: (id: string) =>
        set((state: SettlementStore) => {
          if (state.rollings.length <= 1) return state;
          return { rollings: state.rollings.filter((r) => r.id !== id) };
        }),

      setRollingAmount: (id: string, amount: number) =>
        set((state: SettlementStore) => ({
          rollings: state.rollings.map((r) =>
            r.id === id ? { ...r, amount } : r
          ),
        })),

      setRollingCurrency: (id: string, currency: Currency) =>
        set((state: SettlementStore) => ({
          rollings: state.rollings.map((r) =>
            r.id === id ? { ...r, currency } : r
          ),
        })),

      setRollingFeePercent: (id: string, feePercent: number) =>
        set((state: SettlementStore) => ({
          rollings: state.rollings.map((r) =>
            r.id === id ? { ...r, feePercent } : r
          ),
        })),

      setRollingTarget: (id: string, target: RollingTarget) =>
        set((state: SettlementStore) => ({
          rollings: state.rollings.map((r) =>
            r.id === id ? { ...r, target } : r
          ),
        })),

      setExchangeRateData: (data: ExchangeRateData | null) =>
        set({ exchangeRateData: data }),

      resetInputs: () => {
        const base = get().baseCurrency;
        set((state: SettlementStore) => ({
          buying: { amount: 0, currency: base },
          returning: { amount: 0, currency: base },
          buyingA: 0,
          buyingB: 0,
          returningA: 0,
          returningB: 0,
          inlineForeignAmount: 0,
          inlineRetForeignAmount: 0,
          rollings: state.rollings.map((r) => ({ ...r, amount: 0, currency: base })),
        }));
      },

      getMemberPercentageSum: () =>
        get().members.reduce((sum: number, member) => sum + member.percentage, 0),
    }),
    {
      name: 'settlement-settings',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      partialize: (state) => ({
        revenueAPercent: state.revenueAPercent,
        baseCurrency: state.baseCurrency,
        members: state.members,
        manualExchangeRates: state.manualExchangeRates,
        autoRevenueSplitFromRate: state.autoRevenueSplitFromRate,
        language: state.language,
        inlineFxRate: state.inlineFxRate,
        inlineFxCurrency: state.inlineFxCurrency,
        rollings: state.rollings.map((r) => ({
          id: r.id,
          amount: 0,
          currency: state.baseCurrency,
          feePercent: r.feePercent,
          target: r.target,
        })),
      }),
    }
  )
);
