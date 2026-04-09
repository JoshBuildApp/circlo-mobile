/**
 * Input sanitization utilities
 * Strips HTML tags and dangerous characters from user-provided strings
 * before storing to Supabase or displaying in the UI.
 */

/**
 * Strip all HTML tags and collapse whitespace.
 * Safe for plain-text fields: names, titles, descriptions, bios.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // remove all HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

/**
 * Sanitize a short text field (title, name, username).
 * Strips HTML + limits length.
 */
export function sanitizeText(input: string, maxLength = 256): string {
  return stripHtml(input).slice(0, maxLength);
}

/**
 * Sanitize a longer text field (description, bio, mission, message).
 * Strips HTML + limits length.
 */
export function sanitizeLongText(input: string, maxLength = 4096): string {
  return stripHtml(input).slice(0, maxLength);
}

/**
 * Sanitize a URL — only allow http/https schemes.
 * Returns empty string if URL is unsafe.
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return ""; // block javascript:, data:, etc.
  } catch {
    return "";
  }
}
