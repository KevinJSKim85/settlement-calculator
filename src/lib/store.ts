'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Currency, ExchangeRateData, ExchangeRates, DistributionMember, Language, DEFAULT_SETTINGS } from '@/types';

interface InputField {
  amount: number;
  currency: Currency;
}

export interface SettlementStore {
  // === Settings (persisted) ===
  rollingFeePercentA: number;
  rollingFeePercentB: number;
  revenueAPercent: number;
  baseCurrency: Currency;
  members: DistributionMember[];
  manualExchangeRates: ExchangeRates;
  language: Language;

  // === Input state (not persisted) ===
  buying: InputField;
  returning: InputField;
  rollingA: InputField;
  rollingB: InputField;

  // === Exchange rate data (not persisted) ===
  exchangeRateData: ExchangeRateData | null;

  // === Settings actions ===
  setRollingFeePercentA: (percent: number) => void;
  setRollingFeePercentB: (percent: number) => void;
  setRevenueAPercent: (percent: number) => void;
  setBaseCurrency: (currency: Currency) => void;
  setLanguage: (language: Language) => void;
  setManualExchangeRate: (currency: Currency, rate: number) => void;
  clearManualExchangeRate: (currency: Currency) => void;

  // === Member actions ===
  addMember: (name: string, percentage: number) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, updates: Partial<Pick<DistributionMember, 'name' | 'percentage'>>) => void;

  // === Input actions ===
  setBuying: (amount: number) => void;
  setBuyingCurrency: (currency: Currency) => void;
  setReturning: (amount: number) => void;
  setReturningCurrency: (currency: Currency) => void;
  setRollingA: (amount: number) => void;
  setRollingACurrency: (currency: Currency) => void;
  setRollingB: (amount: number) => void;
  setRollingBCurrency: (currency: Currency) => void;

  // === Exchange rate actions ===
  setExchangeRateData: (data: ExchangeRateData | null) => void;

  // === Utility ===
  resetInputs: () => void;
  getMemberPercentageSum: () => number;
}

export const useSettlementStore = create<SettlementStore>()(
  persist(
    (set, get) => ({
      // === Settings (persisted) ===
      rollingFeePercentA: DEFAULT_SETTINGS.rollingFeePercentA,
      rollingFeePercentB: DEFAULT_SETTINGS.rollingFeePercentB,
      revenueAPercent: DEFAULT_SETTINGS.revenueAPercent,
      baseCurrency: DEFAULT_SETTINGS.baseCurrency,
      members: DEFAULT_SETTINGS.members,
      manualExchangeRates: DEFAULT_SETTINGS.manualExchangeRates,
      language: DEFAULT_SETTINGS.language,

      // === Input state (not persisted) ===
      buying: {
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      },
      returning: {
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      },
      rollingA: {
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      },
      rollingB: {
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      },

      // === Exchange rate data (not persisted) ===
      exchangeRateData: null,

      // === Settings actions ===
      setRollingFeePercentA: (percent: number) =>
        set({ rollingFeePercentA: percent }),

      setRollingFeePercentB: (percent: number) =>
        set({ rollingFeePercentB: percent }),

      setRevenueAPercent: (percent: number) =>
        set({ revenueAPercent: percent }),

      setBaseCurrency: (currency: Currency) =>
        set({ baseCurrency: currency }),

      setLanguage: (language: Language) =>
        set({ language }),

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

      // === Member actions ===
      addMember: (name: string, percentage: number) =>
        set((state: SettlementStore) => {
          if (state.members.length >= 10) {
            console.warn('Maximum 10 members allowed');
            return state;
          }
          const newMember: DistributionMember = {
            id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            percentage,
          };
          return {
            members: [...state.members, newMember],
          };
        }),

      removeMember: (id: string) =>
        set((state: SettlementStore) => {
          if (state.members.length <= 1) {
            console.warn('Minimum 1 member required');
            return state;
          }
          return {
            members: state.members.filter((m) => m.id !== id),
          };
        }),

      updateMember: (id: string, updates: Partial<Pick<DistributionMember, 'name' | 'percentage'>>) =>
        set((state: SettlementStore) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      // === Input actions ===
      setBuying: (amount: number) =>
        set((state: SettlementStore) => ({
          buying: { ...state.buying, amount },
        })),

      setBuyingCurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({
          buying: { ...state.buying, currency },
        })),

      setReturning: (amount: number) =>
        set((state: SettlementStore) => ({
          returning: { ...state.returning, amount },
        })),

      setReturningCurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({
          returning: { ...state.returning, currency },
        })),

      setRollingA: (amount: number) =>
        set((state: SettlementStore) => ({
          rollingA: { ...state.rollingA, amount },
        })),

      setRollingACurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({
          rollingA: { ...state.rollingA, currency },
        })),

      setRollingB: (amount: number) =>
        set((state: SettlementStore) => ({
          rollingB: { ...state.rollingB, amount },
        })),

      setRollingBCurrency: (currency: Currency) =>
        set((state: SettlementStore) => ({
          rollingB: { ...state.rollingB, currency },
        })),

      // === Exchange rate actions ===
      setExchangeRateData: (data: ExchangeRateData | null) =>
        set({ exchangeRateData: data }),

      // === Utility ===
      resetInputs: () =>
        set({
          buying: { amount: 0, currency: get().baseCurrency },
          returning: { amount: 0, currency: get().baseCurrency },
          rollingA: { amount: 0, currency: get().baseCurrency },
          rollingB: { amount: 0, currency: get().baseCurrency },
        }),

      getMemberPercentageSum: () =>
        get().members.reduce((sum: number, member) => sum + member.percentage, 0),
    }),
    {
      name: 'settlement-settings',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          // Fallback for private browsing or environments without localStorage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      partialize: (state) => {
        const { buying, returning, rollingA, rollingB, exchangeRateData, ...persisted } = state;
        return persisted;
      },
    }
  )
);
