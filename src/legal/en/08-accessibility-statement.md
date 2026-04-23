# Circlo — Accessibility Statement (הצהרת נגישות)

> **DRAFT v1.0 — PENDING LAWYER REVIEW**
> Generated 2026-04-23 using `israeli-accessibility-compliance` skill.
> The Hebrew version of this statement is the **legally authoritative version** under IS 5568. The English version below is for international users and must remain consistent with the Hebrew. AI-drafted starting point only — not legal advice.

**Last reviewed:** [VERIFY: insert publication date]
**Next planned review:** [VERIFY: insert publication date + 12 months]
**Conformance target:** **WCAG 2.1 Level AA** as adopted by **Israeli Standard 5568 (תקן ישראלי 5568)**

---

## 1. Our Commitment

Circlo (operated by Guy Avnaim, registered עוסק מורשה) is committed to making circloclub.com accessible to people with disabilities, in accordance with:

- The **Equal Rights for People with Disabilities Law 5758-1998** (חוק שוויון זכויות לאנשים עם מוגבלות תשנ"ח-1998), as amended by **Amendment 36** which extended accessibility duties to online services;
- The **Equal Rights for People with Disabilities Regulations (Service Accessibility Adjustments) 5773-2013** — including Regulation 35 (the accessibility-preferences widget on the website);
- **Israeli Standard 5568** (תקן ישראלי 5568) — Hebrew adaptation of WCAG 2.1, conformance level **AA**.

We treat accessibility as a continuous practice, not a one-time project. As Circlo grows, we will continue to invest in accessibility.

---

## 2. What We've Done — Implemented Accessibility Features

The following accessibility features are live across the Platform (circloclub.com):

### 2.1 Site-wide structural accessibility
- `lang="he"` and `dir="rtl"` correctly set on every Hebrew page; `lang="en"` and `dir="ltr"` for English pages
- "Skip to main content" link (דלג לתוכן הראשי) as the first focusable element on every page
- Semantic HTML5 landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` with appropriate ARIA roles
- Logical DOM order matching the visual reading order in both RTL and LTR contexts

### 2.2 Visual accessibility
- All text content meets the **4.5:1 minimum contrast ratio** (WCAG AA / IS 5568) against background — verified at design-system level using shadcn/Radix UI primitives
- Large text meets the **3:1 minimum contrast ratio**
- Focus indicators visible on every interactive element (no `outline: none` without alternative)
- Page layouts work at zoom levels up to 200% without loss of content or function
- Page is responsive and usable on mobile (mobile-first design)

### 2.3 Keyboard accessibility
- Every interactive element is reachable via Tab key in a logical order
- Modal dialogs (sheets, drawers, dropdowns) trap focus appropriately and return focus on close
- Custom interactive components (built on Radix UI) inherit keyboard accessibility from the underlying primitives

### 2.4 Screen reader accessibility
- All non-decorative images carry meaningful `alt` text
- Decorative images use empty `alt=""` so screen readers skip them
- Buttons and icon-only controls carry `aria-label` in the appropriate language
- Form inputs are correctly associated with their labels via `<label for="">` or `aria-labelledby`
- Validation errors use `role="alert"` so screen readers announce them
- Live regions (`aria-live`) announce dynamic content updates such as new chat messages

### 2.5 Forms
- Required fields marked with `aria-required="true"` (in addition to the visible asterisk)
- Phone number and Israeli ID number fields marked `dir="ltr"` even within RTL layouts so screen readers read digits in the natural order
- Inline validation messages in Hebrew for Hebrew-language sessions; in English for English sessions

### 2.6 Languages and content
- Full support for Hebrew RTL and English LTR
- `<span dir="ltr" lang="en">` markup around English brand names, URLs, or numbers embedded in Hebrew text so screen readers switch correctly

### 2.7 Accessibility preferences widget (planned per Regulation 35)
We intend to ship the standard Regulation 35 accessibility-preferences widget — a floating panel offering toggles for: contrast, text size, line spacing, readable font, link highlighting, large/black cursor, motion reduction, and a one-click reset. The widget will be activatable via `Alt+A` and from a fixed button in the corner of every page.

[VERIFY: implement and ship the Regulation 35 widget. Currently NOT live — list as a known limitation in Section 3 below until shipped.]

---

## 3. Known Limitations (Honest Disclosure)

We commit to honesty about gaps. The following areas need further work and are on our accessibility backlog:

1. **Coach-uploaded videos do not yet have captions or transcripts.** This is the largest accessibility gap. We plan to add (a) machine-generated Hebrew captions on upload as a baseline, and (b) coach tooling to edit captions for accuracy. Until then, deaf and hard-of-hearing users cannot access the audio content of coach videos.
2. **Regulation 35 accessibility-preferences widget is not yet live.** Implementation is planned. Until then, users who rely on contrast/text-size adjustment must use their browser's zoom and OS-level high-contrast settings.
3. **Some user-generated images** (coach posts, profile photos) may have generic or missing `alt` text where the uploader did not provide a description. We are exploring an opt-in AI-generated alt-text suggestion at upload to improve coverage.
4. **PDF exports** of bookings and receipts are generated by Stripe and have not been independently audited for screen-reader compatibility.
5. **Real-time chat indicator sounds** (e.g. message-received chimes) currently have no visual-only alternative for users who disable sound or are deaf.

If you encounter an accessibility barrier not listed here, please tell us using the contact details in Section 5 — we will treat it as a priority bug.

---

## 4. Accessibility Coordinator (רכז נגישות)

Per Regulation 35 of the Equal Rights for People with Disabilities Regulations:

**Accessibility Coordinator:** Guy Avnaim
**Role:** Operator / Founder
**Email:** circlomanagement@circloclub.com
**Phone:** [VERIFY: insert business phone]
**Address:** [VERIFY: insert registered business address]

[VERIFY: Regulation 35 normally requires a designated coordinator only for businesses above the 25-employee threshold. Circlo, as a sole-proprietor operation, falls below that threshold. We are appointing a coordinator voluntarily as best practice; this should be confirmed acceptable with counsel and updated when staffing changes.]

The accessibility coordinator is responsible for:
- Receiving and responding to accessibility complaints
- Reviewing this Accessibility Statement at least every 12 months
- Coordinating accessibility improvements
- Liaising with accessibility consultants when audits are commissioned

---

## 5. How to Report an Accessibility Issue

If you encounter a problem accessing any part of the Platform, please tell us. We commit to acknowledging your message within **5 business days** and to working in good faith toward a solution.

**Email:** **circlomanagement@circloclub.com**
**Subject line:** "Accessibility — [brief description]"

**Phone:** [VERIFY: insert business phone]
**Hours:** [VERIFY: e.g. Sunday–Thursday 09:00–17:00 Israel time, excluding Shabbat and chagim]

**By post:** [VERIFY: insert registered business address]

When reporting, please include (where possible):
- The page URL where you encountered the issue
- A description of the problem
- The browser and assistive technology you were using (e.g. NVDA on Chrome, VoiceOver on iPhone)
- A screenshot if helpful

You may also file a complaint with the **Commission for Equal Rights of Persons with Disabilities (נציבות שוויון זכויות לאנשים עם מוגבלות)** at the Ministry of Justice if you believe Circlo is not meeting its accessibility duties:
https://www.gov.il/he/departments/mugbaluyot

---

## 6. Audits & Continuous Improvement

We periodically audit the Platform for accessibility issues using:
- **Automated tools**: axe-core (DevTools extension), Lighthouse accessibility audit, screen-reader spot-checks with NVDA and VoiceOver
- **Manual testing**: keyboard-only navigation, high-contrast mode, screen-reader walkthroughs of critical flows (signup, booking, payment, messaging)
- **User reports**: feedback received via the channels in Section 5

This statement is reviewed and updated at least once every 12 months, and immediately following any material change to the Platform that affects accessibility.

**Last reviewed:** [VERIFY: publication date]
**Next planned review:** [VERIFY: publication date + 12 months]

---

## 7. Standards & Methodology

This statement is published in accordance with:

- Equal Rights for People with Disabilities Law 5758-1998 (Amendment 36)
- Equal Rights for People with Disabilities Regulations (Service Accessibility Adjustments) 5773-2013, particularly Regulations 34, 35, and 36
- Israeli Standard 5568 (Hebrew adaptation of WCAG 2.1, conformance level AA)
- Web Content Accessibility Guidelines (WCAG) 2.1 — W3C Recommendation

We commit to staying current as these standards evolve.

---

## 8. Statement Versioning & Hebrew Authority

This English statement is provided for international users. The **Hebrew version** at https://circloclub.com/legal/accessibility (Hebrew) is the **legally authoritative version** under IS 5568 — which requires accessibility statements on Israeli sites to be available in Hebrew. In any conflict between the English and the Hebrew, the Hebrew governs.

---

## Plain-Language Summary

- We're committed to making Circlo accessible. Our goal is **WCAG 2.1 AA** (the international standard) as adopted by Israel's IS 5568 standard.
- We've built in: keyboard navigation, screen reader support, proper Hebrew RTL handling, color contrast, semantic structure, focus indicators, and Hebrew error messages.
- **What's NOT done yet:** captions on coach videos, the Regulation 35 accessibility widget, alt-text on every user-uploaded image. We'll add these.
- **Our accessibility contact:** Guy Avnaim — circlomanagement@circloclub.com
- **We promise to acknowledge accessibility reports within 5 business days.**
- If we don't fix it, you can complain to the **Commission for Equal Rights of Persons with Disabilities** at the Ministry of Justice.

---

**[END OF DRAFT v1.0]**

**To-do before publication:**
1. Insert all `[VERIFY: ...]` values (phone, address, dates).
2. Decide whether to ship the Regulation 35 accessibility widget at launch or accept it as a known limitation. Strongly recommend shipping it — there's a copy-pasteable React + Tailwind implementation in the `israeli-accessibility-compliance` skill's `references/widget-implementation.md`.
3. Run `axe-core` (DevTools or `npm i -D @axe-core/cli`) against `/`, `/discover`, `/login`, `/signup`, `/coach/:id`, `/bookings`, `/inbox` and fix any AA-level errors before publication.
4. Translate to Hebrew. The Hebrew version is the legally authoritative one — get it lawyer-reviewed alongside the other docs.
5. Publish at `circloclub.com/legal/accessibility` and link from every page footer (this link is mandatory under IS 5568).
6. Add a permanent "Accessibility" link in the site footer.
7. Schedule the 12-month review reminder in the calendar.
