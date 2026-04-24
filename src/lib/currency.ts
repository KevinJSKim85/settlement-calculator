import type { Currency, ExchangeRates } from "@/types";
import { CURRENCY_CONFIG } from "@/types";

export function convertAmount(
	amount: number,
	from: Currency,
	to: Currency,
	rates: ExchangeRates,
	baseCurrency: Currency,
): number {
	if (from === to) return amount;

	const fromRate = from === baseCurrency ? 1 : rates[from];
	const toRate = to === baseCurrency ? 1 : rates[to];

	if (fromRate === undefined || toRate === undefined || toRate === 0) {
		return amount;
	}

	const amountInBase = amount * fromRate;
	const converted = amountInBase / toRate;

	return roundToPrecision(converted, to);
}

export function formatCurrency(amount: number, currency: Currency): string {
	const config = CURRENCY_CONFIG[currency];
	const safeAmount = Number.isFinite(amount) ? amount : 0;
	const rounded = roundToPrecision(safeAmount, currency);

	const formatted = new Intl.NumberFormat("en-US", {
		minimumFractionDigits: config.decimals,
		maximumFractionDigits: config.decimals,
	}).format(Math.abs(rounded));

	const sign = rounded < 0 ? "-" : "";
	return `${sign}${config.symbol}${formatted}`;
}

export function getCurrencySymbol(currency: Currency): string {
	return CURRENCY_CONFIG[currency].symbol;
}

export function getDecimalPlaces(currency: Currency): number {
	return CURRENCY_CONFIG[currency].decimals;
}

export function roundToPrecision(amount: number, currency: Currency): number {
	if (!Number.isFinite(amount)) return 0;
	const decimals = CURRENCY_CONFIG[currency].decimals;
	const factor = 10 ** decimals;
	return Math.round(amount * factor) / factor;
}

export function formatNumber(amount: number, decimals: number = 0): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals,
	}).format(amount);
}

export function parseFormattedNumber(value: string): number {
	const cleaned = value.replace(/[^0-9.-]/g, "");
	const parsed = parseFloat(cleaned);
	return Number.isNaN(parsed) ? 0 : parsed;
}
