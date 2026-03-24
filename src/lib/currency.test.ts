import { describe, expect, it } from "vitest";

import {
	convertAmount,
	formatCurrency,
	getCurrencySymbol,
	getDecimalPlaces,
	parseFormattedNumber,
	roundToPrecision,
} from "./currency";

describe("formatCurrency", () => {
	it("formats KRW", () => {
		expect(formatCurrency(1234567, "KRW")).toBe("₩1,234,567");
	});

	it("formats USD", () => {
		expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
	});

	it("formats JPY", () => {
		expect(formatCurrency(1234, "JPY")).toBe("¥1,234");
	});

	it("formats CNY", () => {
		expect(formatCurrency(1234.56, "CNY")).toBe("¥1,234.56");
	});

	it("formats HKD", () => {
		expect(formatCurrency(1234.56, "HKD")).toBe("HK$1,234.56");
	});

	it("formats USDT", () => {
		expect(formatCurrency(1234.56, "USDT")).toBe("₮1,234.56");
	});

	it("formats negative values", () => {
		expect(formatCurrency(-1234567, "KRW")).toBe("-₩1,234,567");
	});

	it("formats zero", () => {
		expect(formatCurrency(0, "USD")).toBe("$0.00");
	});
});

describe("convertAmount", () => {
	it("returns amount unchanged for same currency", () => {
		expect(convertAmount(100, "USD", "USD", {}, "USD")).toBe(100);
	});

	it("converts USD to KRW", () => {
		expect(convertAmount(100, "USD", "KRW", { USD: 1, KRW: 1300 }, "USD")).toBe(
			130000,
		);
	});

	it("converts KRW to USD", () => {
		expect(
			convertAmount(130000, "KRW", "USD", { USD: 1, KRW: 1300 }, "USD"),
		).toBe(100);
	});

	it("returns original amount when rate is missing", () => {
		expect(convertAmount(100, "USD", "KRW", { USD: 1 }, "USD")).toBe(100);
	});
});

describe("roundToPrecision", () => {
	it("rounds KRW to 0 decimals", () => {
		expect(roundToPrecision(1234.56, "KRW")).toBe(1235);
	});

	it("rounds USD to 2 decimals", () => {
		expect(roundToPrecision(1234.555, "USD")).toBe(1234.56);
	});

	it("rounds JPY to 0 decimals", () => {
		expect(roundToPrecision(99.9, "JPY")).toBe(100);
	});
});

describe("getCurrencySymbol", () => {
	it("returns symbols for all currencies", () => {
		expect(getCurrencySymbol("KRW")).toBe("₩");
		expect(getCurrencySymbol("USD")).toBe("$");
		expect(getCurrencySymbol("CNY")).toBe("¥");
		expect(getCurrencySymbol("HKD")).toBe("HK$");
		expect(getCurrencySymbol("JPY")).toBe("¥");
		expect(getCurrencySymbol("USDT")).toBe("₮");
	});
});

describe("getDecimalPlaces", () => {
	it("returns decimal precision for all currencies", () => {
		expect(getDecimalPlaces("KRW")).toBe(0);
		expect(getDecimalPlaces("USD")).toBe(2);
		expect(getDecimalPlaces("CNY")).toBe(2);
		expect(getDecimalPlaces("HKD")).toBe(2);
		expect(getDecimalPlaces("JPY")).toBe(0);
		expect(getDecimalPlaces("USDT")).toBe(2);
	});
});

describe("parseFormattedNumber", () => {
	it("parses comma-separated integer", () => {
		expect(parseFormattedNumber("1,234,567")).toBe(1234567);
	});

	it("parses formatted USD", () => {
		expect(parseFormattedNumber("$1,234.56")).toBe(1234.56);
	});

	it("parses formatted KRW", () => {
		expect(parseFormattedNumber("₩10,000,000")).toBe(10000000);
	});

	it("returns 0 for empty string", () => {
		expect(parseFormattedNumber("")).toBe(0);
	});

	it("returns 0 for non-numeric input", () => {
		expect(parseFormattedNumber("abc")).toBe(0);
	});
});
