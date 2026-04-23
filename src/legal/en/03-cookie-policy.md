# Circlo — Cookie Policy

> **DRAFT v0.1 — PENDING LAWYER REVIEW**
> Generated 2026-04-23. Companion to the Privacy Policy. Israeli law (Privacy Protection Law + Section 30A of the Communications Law) does not have a cookie-specific statute, but the Privacy Protection Authority strongly recommends explicit opt-in consent for non-essential cookies. This policy follows that best-practice standard.

**Last updated:** [VERIFY date of publication]
**Version:** 1.1 draft
**Changelog from v0.1:** added accessibility-of-banner commitment (§3.5)

---

## 1. What Are Cookies?

A **cookie** is a small text file stored on your device when you visit a website. We also use related technologies — `localStorage`, `sessionStorage`, and small tracking pixels in email — collectively referred to in this policy as "cookies".

We use cookies to keep you logged in, secure your session, remember your preferences, and (only with your consent) understand how the Platform is used and how to improve it.

---

## 2. Cookie Categories We Use

We group cookies into three categories. **Only essential cookies are active by default.** Analytics and error-monitoring cookies require your explicit opt-in through the cookie banner.

### 2.1 Essential Cookies (always on)

These cookies are strictly necessary for the Platform to work. They cannot be disabled without breaking core functionality such as login or payment.

| Name | Purpose | Provider | Duration |
|---|---|---|---|
| `circlo-auth` | Session token — keeps you logged in (HttpOnly-equivalent via secure cookie storage) | Circlo / Supabase Auth | Session + 90 days refresh |
| `sb-*` | Supabase auth refresh tokens, anti-CSRF | Supabase | Session |
| `site_consent` | Records your cookie consent choice (so we don't keep asking) | Circlo | 12 months |
| Stripe `__stripe_*` | Fraud prevention on payment forms | Stripe | Session + 1 hour |
| `hcaptcha` | Bot prevention on signup/login forms | hCaptcha | Session |

### 2.2 Analytics Cookies (opt-in only)

Set only after you click **Accept** or **Customize → Analytics: On** in the cookie banner. We use **PostHog** to understand which features are used, which pages cause confusion, and which funnels are working. Data is sent to PostHog's US Cloud (us.i.posthog.com).

| Name | Purpose | Provider | Duration |
|---|---|---|---|
| `ph_*_posthog` | Anonymized session ID, distinct user ID, feature-flag state | PostHog | 12 months |
| Internal pageview counters | Aggregate page-view counts | Circlo (server-side) | 12 months |

If you decline, **we do not load the PostHog SDK at all** — no script tag, no network request, no fingerprint. Declining means we collect no behavioral data.

### 2.3 Error Monitoring Cookies (opt-in only)

Set only after you opt in. We use **Sentry** to capture JavaScript crashes so we can fix bugs faster. Sentry receives a stack trace, your user ID (if logged in), browser info, and the URL where the error happened. We do **not** enable Sentry's session-replay feature without a separate opt-in.

| Name | Purpose | Provider | Duration |
|---|---|---|---|
| `sentry-trace` | Distributed tracing for an in-flight error | Sentry | Session |

### 2.4 What We Do NOT Use

- ❌ Advertising cookies
- ❌ Third-party advertising trackers (Facebook Pixel, Google Ads remarketing, TikTok Pixel, etc.)
- ❌ Cross-site behavioral profiling
- ❌ Data sales to ad networks

---

## 3. Your Choices

### 3.1 The Cookie Banner
On your first visit you'll see a cookie banner with three options of equal visual weight:

- **Accept all** — turns on all categories
- **Reject all** — only essential cookies; analytics + error monitoring stay off
- **Customize** — toggle each non-essential category individually

Closing the banner (Esc, X, or clicking outside it) is treated as **Reject all** for non-essential categories — your service is not degraded for refusing.

### 3.2 Changing Your Mind
You can change your cookie preferences at any time:

- Click **Privacy Preferences** in the Platform footer.
- Or email **circlomanagement@circloclub.com** and we'll handle it.

Changing your preferences takes effect immediately. If you turn off analytics, the SDK is unloaded and no further tracking events are sent.

### 3.3 Withdrawing Consent Is As Easy as Granting It
We honor Amendment 13 Article 8C and GDPR Article 7(3) — withdrawing consent must be as easy as granting it. The same dialog appears when you click "Privacy Preferences" as appeared on your first visit.

### 3.4 Browser-Level Controls
Most browsers also let you block or delete cookies in their settings. Note that blocking essential cookies will prevent login and other Platform functions.

### 3.5 Accessibility of the Cookie Banner (added in v1.1)
The cookie banner is built to comply with IS 5568 conformance level AA:

- All toggles and buttons are reachable by keyboard (Tab + Enter/Space)
- Buttons carry `aria-pressed` for binary toggles where appropriate, and full descriptive labels for cycling controls
- The banner is announced by screen readers via `role="dialog"` with appropriate `aria-labelledby`
- Closing via the **Escape key** counts as "Reject all" (also documented in Section 3.1) and is announced via a polite live region
- Equal visual weight for the Reject and Accept actions per IS 5568 + GDPR Recital 42 + Israeli PPA guidance

For the full accessibility commitment, see https://circloclub.com/legal/accessibility.

---

## 4. Cross-Border Transfer

Some of the cookie-related data (analytics, errors) is transmitted to providers outside Israel — primarily PostHog and Sentry in the **United States**. This transfer happens only after you have explicitly opted in. See **Section 7 of our Privacy Policy** for the full cross-border-transfer disclosure.

---

## 5. Re-Prompt Schedule

We will ask for your consent again if:

- We add a **new tracker category** (we increment our internal `CONSENT_VERSION` and the banner re-appears).
- **12 months** have passed since your last choice (a fresh prompt to confirm your preferences are still current).

We will **not** re-prompt every session — that's a dark pattern flagged by Israeli and EU regulators.

---

## 6. Audit Trail

To prove that we have your consent (or your refusal), we record the following events through our analytics pipeline. These events are exempt from the consent gate because they are how we evidence the consent itself:

- `consent_banner_shown`
- `consent_accepted`
- `consent_rejected`
- `consent_customized`
- `consent_reopened`

We do not record any other event before you grant consent.

---

## 7. Contact

For questions about this Cookie Policy:

**Email:** circlomanagement@circloclub.com
**Subject line:** "Cookies — [your topic]"

---

## Plain-Language Summary

- We use cookies to keep you logged in (essential — always on) and, only if you say yes, to understand how you use the app.
- We don't use ad trackers. Ever.
- Reject is as easy as Accept. Closing the banner = reject.
- You can change your mind any time from "Privacy Preferences" in the footer.
- If you reject analytics, we don't even load the analytics script.

---

**[END OF DRAFT v0.1]**

**To-do before publication:**
1. Insert `[VERIFY: ...]` values.
2. Cross-check the actual cookie names emitted by Supabase Auth, Stripe, hCaptcha, PostHog, and Sentry against the table in §2 — open the browser DevTools → Application → Cookies on a logged-in session and update the table to reality.
3. Implement the cookie banner per the spec (essential always-on, analytics opt-in, equal-weight Accept/Reject, dismissal-as-refusal, withdraw-anywhere). The Privacy Policy already references this; the actual UI is a separate code task.
4. Translate to Hebrew.
