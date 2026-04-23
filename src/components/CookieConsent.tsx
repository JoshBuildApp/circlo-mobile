// Default export shim so the existing App.tsx lazy import keeps working.
// Real implementation lives in CookieConsentBanner.tsx.
import { CookieConsentBanner } from "./CookieConsentBanner";

export default function CookieConsent() {
  return <CookieConsentBanner />;
}
