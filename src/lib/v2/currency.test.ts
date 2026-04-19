import { describe, expect, it } from "vitest";
import { formatCurrency, formatCompactNumber, formatPrice } from "./currency";

describe("currency", () => {
  it("formats ILS by default", () => {
    expect(formatCurrency(280)).toMatch(/₪/);
    expect(formatCurrency(280)).toMatch(/280/);
  });

  it("respects an overridden currency", () => {
    expect(formatCurrency(280, "USD")).toMatch(/\$/);
  });

  it("rounds to whole units by default", () => {
    expect(formatCurrency(280.6)).not.toMatch(/\./);
  });

  it("formatCompactNumber compacts above 1k", () => {
    expect(formatCompactNumber(8500)).toBe("8.5K");
    expect(formatCompactNumber(1_200_000)).toBe("1.2M");
  });

  it("formatPrice is a thin wrapper", () => {
    expect(formatPrice(99)).toBe(formatCurrency(99));
  });
});
