/**
 * Currency + number formatting for v2 UI.
 * Never hardcode ₪ — always use `formatCurrency`.
 */
export type CurrencyCode = "ILS" | "USD" | "EUR";

const DEFAULT_LOCALE = "en-IL";
const DEFAULT_CURRENCY: CurrencyCode = "ILS";

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  opts: { maximumFractionDigits?: number; locale?: string } = {}
): string {
  const { maximumFractionDigits = 0, locale = DEFAULT_LOCALE } = opts;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount);
}

export function formatCompactNumber(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Formats amount with the currency symbol only (no ISO code), e.g. "₪280".
 * Convenience wrapper around formatCurrency for dense UIs.
 */
export function formatPrice(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return formatCurrency(amount, currency);
}
