const UTM_STORAGE_KEY = "circlo_utm";
const UTM_EXPIRY_DAYS = 30;

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  captured_at?: string;
  landing_page?: string;
}

interface StoredUTM extends UTMParams {
  expires_at: string;
}

/**
 * Reads UTM params from the current URL and stores them in localStorage.
 * Only writes if UTM params are present — never overwrites with empty data.
 */
export function captureUTMParams(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  let hasUTM = false;

  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      utm[key] = value;
      hasUTM = true;
    }
  }

  if (!hasUTM) return;

  utm.captured_at = new Date().toISOString();
  utm.landing_page = window.location.pathname;

  const stored: StoredUTM = {
    ...utm,
    expires_at: new Date(Date.now() + UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Returns stored UTM params, or null if none exist or they've expired.
 */
export function getStoredUTMParams(): UTMParams | null {
  const raw = localStorage.getItem(UTM_STORAGE_KEY);
  if (!raw) return null;

  try {
    const data: StoredUTM = JSON.parse(raw);
    if (new Date(data.expires_at) < new Date()) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
    const { expires_at: _, ...utm } = data;
    return utm;
  } catch {
    return null;
  }
}

/**
 * Clears stored UTM params. Call after attribution is recorded.
 */
export function clearUTMParams(): void {
  localStorage.removeItem(UTM_STORAGE_KEY);
}
