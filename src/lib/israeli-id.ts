// Israeli ID number (Teudat Zehut, תעודת זהות) validation.
//
// Used at the parental-signature step of the Trainee Waiver to evidence the
// parent/guardian's identity for the legally-binding electronic signature.
// The ID number is stored in encrypted form (column encryption at the DB
// layer); see Trainee Waiver §7 + Privacy Policy §3.7.
//
// Algorithm: Standard Israeli ID checksum (Luhn variant). See e.g.
// https://he.wikipedia.org/wiki/מספר_זהות_(ישראל)#בדיקת_תקינות
//   - 9 digits total (left-pad with zeros if shorter)
//   - Multiply each digit by 1 or 2 alternating from the left
//   - If a doubled product is >9, sum its digits
//   - Total sum must be divisible by 10

const NINE_DIGIT_RE = /^\d{1,9}$/;

export type IsraeliIdValidation =
  | { valid: true; normalized: string }
  | { valid: false; reason: "empty" | "non-numeric" | "wrong-length" | "bad-checksum" };

/**
 * Validate an Israeli Teudat Zehut (תעודת זהות) number.
 * Returns { valid: true, normalized } on success — the normalized form is
 * 9 digits, zero-padded on the left.
 */
export function validateIsraeliId(input: string | null | undefined): IsraeliIdValidation {
  const trimmed = (input ?? "").trim();
  if (trimmed.length === 0) return { valid: false, reason: "empty" };
  if (!NINE_DIGIT_RE.test(trimmed)) return { valid: false, reason: "non-numeric" };
  if (trimmed.length > 9) return { valid: false, reason: "wrong-length" };

  // Left-pad to 9 digits.
  const padded = trimmed.padStart(9, "0");
  const digits = padded.split("").map((d) => Number(d));

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = digits[i] * (i % 2 === 0 ? 1 : 2);
    if (n > 9) n = Math.floor(n / 10) + (n % 10);
    sum += n;
  }

  if (sum % 10 !== 0) return { valid: false, reason: "bad-checksum" };
  return { valid: true, normalized: padded };
}

/**
 * Validate an Israeli mobile phone number.
 * Accepts: +972-5X-XXX-XXXX, 972-5X-XXX-XXXX, 05X-XXX-XXXX, 05XXXXXXXX,
 *          and equivalent without separators. Returns the canonical
 *          international form (+9725XXXXXXXX) on success.
 */
export type IsraeliPhoneValidation =
  | { valid: true; canonical: string }
  | { valid: false; reason: "empty" | "non-numeric" | "wrong-length" | "non-mobile" };

export function validateIsraeliMobile(input: string | null | undefined): IsraeliPhoneValidation {
  const raw = (input ?? "").replace(/[\s\-()]/g, "");
  if (raw.length === 0) return { valid: false, reason: "empty" };

  // Strip leading +, 00, or 972.
  let stripped = raw;
  if (stripped.startsWith("+")) stripped = stripped.slice(1);
  if (stripped.startsWith("972")) stripped = stripped.slice(3);
  if (stripped.startsWith("0")) stripped = stripped.slice(1);

  if (!/^\d+$/.test(stripped)) return { valid: false, reason: "non-numeric" };
  if (stripped.length !== 9) return { valid: false, reason: "wrong-length" };

  // Israeli mobile prefixes (post-strip-leading-0): 5X.
  if (!stripped.startsWith("5")) return { valid: false, reason: "non-mobile" };

  return { valid: true, canonical: `+972${stripped}` };
}
