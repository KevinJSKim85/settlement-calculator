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
  rollingFeePercent: number;
  revenueAPercent: number;
  baseCurrency: Currency;
  members: DistributionMember[];
  manualExchangeRates: ExchangeRates;
  language: Language;

  // === Input state (not persisted) ===
  buying: InputField;
  returning: InputField;
  rolling: InputField;

  // === Exchange rate data (not persisted) ===
  exchangeRateData: ExchangeRateData | null;

  // === Settings actions ===
  setRollingFeePercent: (percent: number) => void;
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
  setRolling: (amount: number) => void;
  setRollingCurrency: (currency: Currency) => void;

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
      rollingFeePercent: DEFAULT_SETTINGS.rollingFeePercent,
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
      rolling: {
        amount: 0,
        currency: DEFAULT_SETTINGS.baseCurrency,
      },

      // === Exchange rate data (not persisted) ===
      exchangeRateData: null,

      // === Settings actions ===
      setRollingFeePercent: (percent: number) =>
        set({ rollingFeePercent: percent }),

      setRevenueAPercent: (percent: number) =>
        set({ revenueAPercent: percent }),

      setBaseCurrency: (currency: Currency) =>
        set({ baseCurrency: currency }),

      setLanguage: (language: Language) =>
        set({ language }),

      setManualExchangeRate: (currency: Currency, rate: number) =>
        set((state: any) => ({
          manualExchangeRates: {
            ...state.manualExchangeRates,
            [currency]: rate,
          },
        })),

      clearManualExchangeRate: (currency: Currency) =>
        set((state: any) => {
          const { [currency]: _, ...rest } = state.manualExchangeRates;
          return { manualExchangeRates: rest };
        }),

      // === Member actions ===
      addMember: (name: string, percentage: number) =>
        set((state: any) => {
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
        set((state: any) => {
          if (state.members.length <= 1) {
            console.warn('Minimum 1 member required');
            return state;
          }
          return {
            members: state.members.filter((m: any) => m.id !== id),
          };
        }),

      updateMember: (id: string, updates: Partial<Pick<DistributionMember, 'name' | 'percentage'>>) =>
        set((state: any) => ({
          members: state.members.map((m: any) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      // === Input actions ===
      setBuying: (amount: number) =>
        set((state: any) => ({
          buying: { ...state.buying, amount },
        })),

      setBuyingCurrency: (currency: Currency) =>
        set((state: any) => ({
          buying: { ...state.buying, currency },
        })),

      setReturning: (amount: number) =>
        set((state: any) => ({
          returning: { ...state.returning, amount },
        })),

      setReturningCurrency: (currency: Currency) =>
        set((state: any) => ({
          returning: { ...state.returning, currency },
        })),

      setRolling: (amount: number) =>
        set((state: any) => ({
          rolling: { ...state.rolling, amount },
        })),

      setRollingCurrency: (currency: Currency) =>
        set((state: any) => ({
          rolling: { ...state.rolling, currency },
        })),

      // === Exchange rate actions ===
      setExchangeRateData: (data: ExchangeRateData | null) =>
        set({ exchangeRateData: data }),

      // === Utility ===
      resetInputs: () =>
        set({
          buying: { amount: 0, currency: get().baseCurrency },
          returning: { amount: 0, currency: get().baseCurrency },
          rolling: { amount: 0, currency: get().baseCurrency },
        }),

      getMemberPercentageSum: () =>
        get().members.reduce((sum: number, member: any) => sum + member.percentage, 0),
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
      partialize: (state: any) => {
        const { buying, returning, rolling, exchangeRateData, ...persisted } = state;
        return persisted;
      },
    }
  )
);
