# Circlo — Privacy Policy

> **DRAFT v1.1 — PENDING LAWYER REVIEW**
> Generated 2026-04-23, revised same day. Built using `israeli-privacy-shield`, `israeli-ai-compliance-kit`, and `israeli-cyber-regulations` skills.
> Must be reviewed by a licensed Israeli privacy attorney (orech din specializing in pratiut) before publication. AI-drafted starting point only — not legal advice.

**Last updated:** [VERIFY date of publication]
**Version:** 1.1 draft
**Language of record:** Hebrew (the Hebrew translation governs in case of conflict)
**Changelog from v0.1:** beefed-up AI governance (§15), cyber-posture alignment with INCD guidance (§12), explicit Hebrew-text-in-Postgres security note, link to Accessibility Statement

---

## 1. Introduction & Scope

This Privacy Policy explains how **Circlo** ("we", "us", "our") collects, uses, shares, and protects personal data of users of the Circlo platform — circloclub.com and any associated mobile or web application ("Platform").

It applies to all visitors, registered users (Trainees and Coaches), and anyone whose personal data we process in connection with the Platform.

We process your personal data in accordance with the **Israeli Privacy Protection Law 5741-1981 (חוק הגנת הפרטיות תשמ"א-1981)**, as amended by **Amendment 13** (effective 14 August 2025), and the **2017 Privacy Protection Regulations (Data Security)**.

By using the Platform, you confirm you have read and understood this Privacy Policy. Where the law requires consent, we will request it explicitly through our cookie banner or in-app prompts.

---

## 2. Identity of the Controller

The data controller responsible for your personal data is:

- **Operator:** Guy Avnaim
- **Trade name:** Circlo
- **Legal status:** Registered as עוסק מורשה (osek murshe — sole proprietor) in Israel
- **Osek murshe number:** [VERIFY: insert 9-digit מספר עוסק מורשה]
- **Registered business address:** [VERIFY: insert address]
- **Email for privacy queries:** circlomanagement@circloclub.com
- **Phone:** [VERIFY: insert business phone]

Because Circlo currently operates at a scale below the Amendment 13 thresholds for mandatory Privacy Protection Officer appointment, we have **not appointed a formal PPO**. Privacy queries are handled directly by the operator at the address above. We will reassess this if Circlo's user count, sensitive-data volume, or revenue grows past the Amendment 13 thresholds.

[VERIFY: under Amendment 13, the PPO requirement applies to public bodies, data brokers, and entities processing sensitive data at significant scale. Circlo is none of these at launch — but if sports/fitness data is later treated by the PPA as "sensitive data at significant scale", reassessment may be required.]

---

## 3. Categories of Personal Data We Collect

### 3.1 Account & Profile Data
When you register and build your profile, we collect:
- Name, username, email address
- Hashed password (we never see your plaintext password — Supabase Auth handles credentials)
- Age (Trainees) or date of birth where required for age verification
- Profile photo / avatar
- Bio
- City / general location
- Sports of interest

### 3.2 Booking Data
When you book a session, we collect:
- Date, time, sport, and duration of the session
- Coach selected
- Price paid
- Payment metadata (Stripe transaction ID, payment status — we do **not** store your card number, CVV, or expiry; those are held by Stripe)

### 3.3 Messaging Data
When you chat with a Coach or Trainee through the in-app messaging:
- The text content of your messages
- Timestamps and read receipts
- Image / file attachments you send

### 3.4 Coach-Specific Data
For users who register as a Coach:
- Bank details required for Stripe Connect payouts (held by Stripe; we do not store the IBAN/account number on Circlo's servers)
- Professional credentials, certifications, and self-declared qualifications
- Content you upload (videos, posts, photos)
- Commission and payout history

### 3.5 Behavioral Data
We collect data about how you use the Platform via PostHog (our product analytics provider):
- Page views, screen views, navigation paths
- Buttons clicked, search queries entered
- Sessions you viewed, coaches you saved or followed
- Likes, comments, video watch progress

### 3.6 Technical Data
Automatically collected on every visit:
- **IP address** (under Amendment 13, this is now classified as personal data)
- Approximate geolocation derived from IP
- Browser type and version, operating system, device type and model
- Referrer URL (the page you came from)
- Session duration, pages per session
- Crash reports and error stack traces (via Sentry)
- Server-side request logs (via Supabase)

### 3.7 Marketing & Communication Data
If you receive transactional or marketing email from us:
- Whether you opened the email
- Whether you clicked a link in the email
- Whether you unsubscribed

We do **not** purchase contact lists or process personal data of people who have not interacted with the Platform.

---

## 4. Sources of Data

We collect personal data from three sources:

1. **Directly from you** — when you register, build your profile, book a session, message, upload content, or contact support.
2. **Automatically** — when your device interacts with the Platform (technical and behavioral data above).
3. **From third parties** — limited cases: payment confirmations from Stripe, OAuth login data from Google (if you sign in with Google) and Apple (if you sign in with Apple — coming soon), and abuse reports from other users.

---

## 5. Purposes & Lawful Basis for Processing

We process your personal data for the following purposes, on the following lawful bases:

| Purpose | Lawful Basis |
|---|---|
| Operate the Platform, provide booking + messaging + content + payment functionality | Performance of contract (these Terms of Service) |
| Process payments, calculate platform fees, issue payouts to Coaches | Performance of contract + legal obligation (tax law) |
| Verify Coach identity and credentials | Legitimate interest in marketplace integrity + safety |
| Send transactional email (booking confirmations, password resets, receipts) | Performance of contract |
| Send marketing email (newsletter, product updates, promotions) | **Explicit opt-in consent only** (Section 30A Communications Law — חוק התקשורת (בזק ושידורים) תשמ"ב-1982) |
| Produce aggregated, anonymized analytics about Platform usage | Legitimate interest |
| Personalize content (recommended coaches, smart feed ranking) | Consent (where opt-in given) + legitimate interest |
| Detect fraud, abuse, security incidents | Legitimate interest + legal obligation |
| Comply with tax, accounting, and consumer protection law | Legal obligation |
| Defend legal claims | Legitimate interest |

---

## 6. Recipients & Third-Party Sub-Processors

We share personal data with the following sub-processors. Each is bound by a data processing agreement (or its equivalent under Israeli law) and may only use the data to provide the service to Circlo.

| Sub-processor | Role | Data shared | Data residency | Cross-border transfer safeguard |
|---|---|---|---|---|
| **Supabase** (Supabase Inc.) | Database, auth, file storage, realtime | All Platform data — accounts, profiles, bookings, messages, content | [VERIFY: which Supabase region — likely AP-Northeast-2 / Seoul or EU-West / Frankfurt; check project settings] | Adequacy decision (if EU region) or contractual clauses (if non-EU). [VERIFY] |
| **Stripe** (Stripe Inc., USA) | Payment processing, Stripe Connect payouts | Payment metadata, payout bank details, transaction history | USA primarily | Contractual clauses + user consent at checkout |
| **PostHog** (PostHog Inc., USA) | Product analytics, session-level behavioral data | Behavioral data, IP, technical data — only after the user opts in via the cookie banner | US Cloud (us.i.posthog.com) | Contractual clauses + explicit opt-in consent |
| **Sentry** (Functional Software, Inc., USA) | Error monitoring, crash reports | Stack traces, technical data, partial user identifiers (user.id) — gated by consent for any session-replay-style data | USA | Contractual clauses + explicit opt-in consent for replay |
| **Lovable / GPT Engineer App** | Hosting, deployment, build pipeline | All Platform code + assets; access to logs | [VERIFY: confirm hosting region — Cloudflare global edge] | Contractual clauses |
| **Resend** | Transactional email delivery | Email address, email content, open/click events | USA | Contractual clauses + necessity for contract performance |
| **Google** (Sign in with Google) | OAuth authentication | Email + display name + profile photo at sign-in | USA | Contractual clauses + user consent (Google's own consent flow) |
| **Apple** (Sign in with Apple) — coming soon | OAuth authentication | Email (often relayed) + name at sign-in | USA | Contractual clauses + user consent (Apple's own consent flow) |

[VERIFY with counsel: whether each sub-processor's data processing agreement adequately covers Israeli Privacy Protection Law obligations including Amendment 13. Israel has an EU adequacy decision so EU-residency data flows are straightforward. Transfers to the USA require contractual safeguards or explicit consent — we rely on the cookie banner's explicit opt-in for analytics/replay and on contract necessity for Stripe/Resend/Supabase.]

We do **not** sell personal data to third parties. We do **not** share personal data with advertisers.

---

## 7. International Data Transfers

Some of our sub-processors are located outside Israel — primarily in the **United States** (Stripe, PostHog, Sentry, Resend, Google, Apple, Lovable's edge network). The United States does **not** have an Israeli adequacy decision; transfers are made on the following lawful bases:

- **Contractual safeguards** — each sub-processor's data processing agreement contains cross-border transfer terms equivalent to standard contractual clauses.
- **Necessity for contract performance** — we cannot run a global payments network or send email without these processors.
- **Explicit opt-in consent** — for analytics, behavioral data, and any session-replay technologies, we require explicit consent through our cookie banner before transferring data to PostHog or Sentry.

You may withdraw your consent for analytics/behavioral data at any time through the "Privacy Preferences" link in the Platform footer.

---

## 8. Data Retention

We keep personal data only for as long as needed to fulfill the purposes above or as required by law.

| Data Category | Retention Period |
|---|---|
| Active account data (profile, settings) | While your account is active + 90 days after closure |
| Booking records, payment receipts | **7 years** (required by Israeli tax law for invoice retention) [VERIFY exact term] |
| Chat messages | While both participants' accounts are active + 30 days [VERIFY: business call] |
| Coach content (videos, posts) | Until you delete it OR your account is closed; then 30 days in soft-delete then permanent removal |
| Behavioral analytics (PostHog) | 12 months (PostHog default) [VERIFY: Circlo can shorten this in PostHog settings] |
| Error logs (Sentry) | 90 days (Sentry default) |
| Server access logs (Supabase) | 30 days [VERIFY against Supabase Pro plan retention] |
| Marketing email tracking | While you remain subscribed + 12 months after unsubscribe |
| Records relevant to legal claims | Duration of relevant statute of limitations |

When the retention period expires we either delete the data or anonymize it so it can no longer be linked to you.

---

## 9. Your Rights as a Data Subject

Under the Privacy Protection Law and Amendment 13, you have the following rights:

- **Right of access** (Section 13) — you may request a copy of personal data we hold about you.
- **Right of rectification** (Section 14) — you may correct inaccurate data.
- **Right of erasure** — you may request deletion of your data (subject to legal retention obligations such as tax records). Note: Israeli law's right to erasure is narrower than GDPR's "right to be forgotten".
- **Right of portability** — you may request a copy of your data in a structured, commonly used, machine-readable format.
- **Right to withdraw consent** — for processing based on consent (e.g. marketing email, analytics tracking), you may withdraw at any time. Withdrawal does not affect processing done before withdrawal.
- **Right to object** — to processing based on legitimate interest, you may object on grounds relating to your particular situation.
- **Right to lodge a complaint** with the Israeli Privacy Protection Authority (רשות להגנת הפרטיות), www.gov.il/he/departments/the_privacy_protection_authority

To exercise any right, email **circlomanagement@circloclub.com** with the subject line "Privacy Request — [your right]". We will respond within **30 days** of receiving a verifiable request, and may extend by another 30 days for complex requests with notice to you.

We may need to verify your identity before fulfilling a request, to prevent unauthorized disclosure.

---

## 10. Cookies & Tracking

We use cookies and similar technologies to operate the Platform and (with your consent) to analyze usage and improve the experience.

- **Essential cookies** — required for login, security, and basic Platform functionality. These are always active and do not require consent.
- **Analytics cookies** — used by PostHog to understand how the Platform is used. Activated only after explicit opt-in.
- **Error monitoring** — used by Sentry to capture crashes. Activated only after explicit opt-in.

Full details, including each cookie's name, purpose, duration, and provider, are in our **Cookie Policy** at https://circloclub.com/legal/cookies.

You can change your cookie preferences anytime through the "Privacy Preferences" link in the Platform footer.

---

## 10A. Accessibility

The Platform is designed to be accessible per Israeli Standard 5568 (תקן ישראלי 5568, conformance level AA). For the full statement, including the accessibility-coordinator contact, known limitations, and how to report an accessibility barrier, see https://circloclub.com/legal/accessibility.

---

## 11. Minor Protections

The Platform requires users to be at least **13 years old**. Users between 13 and 17 may register only with explicit parental or guardian consent (verified at signup), and a parent or guardian must sign the Trainee Waiver before the minor's first booking.

For minors, we apply the strengthened protections introduced by Amendment 13:
- We do not target marketing communications to known minors.
- We do not use minors' behavioral data to build advertising profiles.
- Parents/guardians may exercise all data subject rights on behalf of a minor by emailing circlomanagement@circloclub.com.
- We will not knowingly collect data from a child under 13. If you believe we have done so inadvertently, contact us immediately and we will delete the data.

---

## 12. Data Security

We comply with the **2017 Privacy Protection Regulations (Data Security)**. We currently operate at the **Basic security level** as defined by the regulations, because Circlo holds fewer than 10,000 records and does not handle clinical/health data, financial industry data, or other regulated sensitive categories at scale. As Circlo grows, we will reassess and migrate to **Medium** or **High** security level as required.

Our current technical and organizational measures include:

- **Encryption in transit** — HTTPS/TLS 1.2+ on all Platform endpoints, enforced HSTS, modern cipher suites
- **Encryption at rest** — Supabase databases encrypt data at rest; Stripe encrypts payment data per PCI DSS 4.0
- **Authentication** — strong password requirements (8+ characters with letters and digits/symbols), bcrypt hashing, optional Sign-in-with-Google / Sign-in-with-Apple, hCaptcha on signup/login to prevent bot abuse
- **Access control** — Row Level Security (RLS) policies on every database table, principle of least privilege for admin access
- **Rate limiting** — 30 sign-in attempts per hour per IP, 30 OTP requests per hour per IP, 150 token refreshes per hour per IP
- **Audit logging** — server-side logs of authentication events, payments, admin actions
- **Monitoring** — Sentry error tracking, postgres logs for anomaly detection
- **Backups** — daily automated database backups with point-in-time recovery via Supabase Pro plan
- **Vendor diligence** — only sub-processors with documented data security practices

Despite these measures, no system is 100% secure. We cannot guarantee absolute security but we work continuously to improve.

### 12.1 Alignment with Israeli Cyber Guidance
Circlo voluntarily aligns its security posture with the **Israel National Cyber Directorate (INCD / Maarach HaSyber)** general guidance for small online businesses. As a sole-proprietor (osek murshe) operation, Circlo is not within scope of:

- **Bank of Israel Directive 361** (cyber for financial institutions) — Circlo is not a financial institution;
- **Bank of Israel Directive 357** (payment security) — payment-card data is held only by Stripe (a PCI-DSS-Level-1 service provider), not by Circlo;
- **ISA cyber requirements for TASE-listed companies** — Circlo is privately held;
- **INCD sector-specific binding directives** for healthtech / fintech / critical infrastructure.

[VERIFY: as Circlo grows, reassess whether sector-specific directives become applicable, particularly if Circlo introduces health/fitness data analytics or partners with regulated entities.]

### 12.2 Hebrew Text & Database Security
Personal data containing Hebrew characters (names, bios, messages) is stored in PostgreSQL via Supabase using UTF-8 encoding with appropriate collation. Hebrew text inputs are escaped at the application layer to prevent SQL injection, RTL Unicode trickery, and direction-override attacks. Search uses parameterized queries and the `pg_trgm` extension scoped to a non-public schema (post-launch hardening per security audit 2026-04-22).

---

## 13. Data Breach Notification

In the event of a security incident that we believe may compromise your personal data, we will:

1. Promptly investigate and contain the incident.
2. Notify the **Israeli Privacy Protection Authority** "without delay" (in accordance with the 2017 Security Regulations and Amendment 13).
3. **Notify affected individuals** if the breach is likely to cause significant harm — by email to your registered address, with a clear description of what happened, what data was affected, and what you can do.
4. Document the incident and our response.

---

## 14. Database Registration with the Privacy Protection Authority

Following Amendment 13 (effective 14 August 2025), database registration with the Privacy Protection Authority (רשם מאגרי המידע) is **only** required for:

- **Public bodies**, or
- **Databases of 10,000 or more individuals where the primary purpose is transferring personal data to others** (data brokers).

Circlo is **neither** a public body **nor** a data broker. We do not sell or transfer personal data for commercial gain to third parties. Accordingly, **Circlo is not required to register its database** under the post-Amendment-13 framework.

[VERIFY: confirm with counsel that the Circlo data model — which transfers data only to sub-processors strictly necessary to deliver the service — does not fall within the "data broker" definition.]

We will reassess this if our activities change.

---

## 15. AI / Automated Decision-Making

This section is written in alignment with **Amendment 13** to the Privacy Protection Law and the **Ministry of Innovation December 2023 AI Policy Principles** (Israel's principal national AI governance framework for the private sector).

### 15.1 Automated Systems Currently in Use
Circlo uses the following automated systems:

| System | Inputs | Output | Decision impact |
|---|---|---|---|
| **Smart feed ranking** | Follow graph, recency, your past engagement (likes, watch time, saves) | Order of videos/posts/stories in your feed | Low — affects content order only |
| **Recommended coaches** | Sport interests, declared location, follow patterns | Coach suggestions on home / discover | Low — discovery aid; you choose what to book |
| **Search ranking** | Search query, coach name, sport, bio | Order of search results in `/discover` | Low — discovery aid |
| **Spam / abuse detection** | Message text patterns, account age, posting velocity | Flag content for human review | Low–Medium — flagged content goes to a human moderator before action |
| **Booking notifications** | Booking event type, your notification preferences | Whether to send an email or push | Low — operational |

### 15.2 What Circlo Does NOT Do (Amendment 13 high-impact thresholds)
None of Circlo's current automated systems makes a decision with **legal or similarly significant effect** on a person (the Amendment 13 threshold for the strongest AI-governance obligations under Article [VERIFY] of Amendment 13). Specifically, Circlo does NOT:

- ❌ Score creditworthiness or insurability
- ❌ Make hiring or employment decisions
- ❌ Make law-enforcement-style profiling decisions
- ❌ Automatically suspend or terminate user accounts (humans make all such decisions)
- ❌ Hold or release Coach payouts based on a model output (humans review any payout dispute)
- ❌ Automatically refund or deny refund requests (humans handle disputes)
- ❌ Use ML-generated coach recommendations as a substitute for the user's choice — recommendations are inputs, not decisions

### 15.3 Transparency Commitments
You may at any time:
- **Opt out** of behavioral personalization by withdrawing consent for analytics in the Privacy Preferences. The smart feed will then degrade gracefully to recency-and-follow-based ordering only.
- **Request explanation** of why a particular coach was recommended to you, by emailing circlomanagement@circloclub.com. We will provide a plain-language summary of the input signals that drove that recommendation.
- **Report errors** in automated outputs (a wrong recommendation, a wrongly-flagged message) — we use this feedback to improve the systems.

### 15.4 Human Oversight
A human reviews:
- Every account suspension or termination
- Every payout hold or dispute
- Every flagged piece of content before removal (except clear spam, which is auto-removed but can be appealed)
- Every refund decision outside the standard policy

### 15.5 EU AI Act Exposure
Circlo currently serves **Israel only** and does not have EU users. The EU AI Act therefore does not directly apply. If Circlo expands to EU users, the smart-feed and recommendation systems above would likely be classified as **limited-risk AI systems** (Article 52 AI Act — disclosure obligation), and we would update this section accordingly.

### 15.6 Reassessment Triggers
We will revisit this section and re-run the Amendment 13 AI-governance assessment if any of the following changes:
- We add an LLM-based feature (chat assistant, AI coach summaries, automated message replies)
- We add an automated decision affecting Coach payouts, account access, or Trainee bookings
- We expand to EU/US users (different regimes apply)
- Circlo grows past the "significant scale" threshold for sensitive-data processing (sports/fitness data may qualify)

[VERIFY with counsel: confirm Amendment 13 article references and the exact wording of the "legal or similarly significant effect" threshold. Counsel should also advise whether sports/health/fitness data is "sensitive data" under Amendment 13 — if yes, additional governance applies once we cross the scale threshold.]

---

## 16. Marketing Communications

We send marketing email (newsletters, product announcements, promotional offers) **only to users who have explicitly opted in**. This complies with Section 30A of the Communications (Bezeq and Broadcasts) Law 5742-1982 — known as the "Spam Law" (חוק הספאם).

Every marketing email includes a one-click unsubscribe link. We honor unsubscribe requests within 24 hours.

We do not need consent for **transactional** messages (booking confirmations, password resets, payment receipts) — those are delivered as part of the service.

---

## 17. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be notified to registered users by email and by an in-Platform notice at least **7 days** before taking effect. The "Last updated" date at the top will always reflect the current version.

If a change materially expands the data we collect or the purposes of processing, we will request fresh consent rather than rely on continued use.

---

## 18. Contact

For any privacy-related question, request, or complaint:

**Email:** circlomanagement@circloclub.com
**Subject line:** "Privacy — [your topic]"
**Operator:** Guy Avnaim, registered עוסק מורשה
**Address:** [VERIFY: insert address]
**Phone:** [VERIFY: insert phone]

If you are not satisfied with our response, you may file a complaint with:

**The Israeli Privacy Protection Authority (הרשות להגנת הפרטיות)**
Ministry of Justice
www.gov.il/he/departments/the_privacy_protection_authority

---

## Plain-Language Summary

For convenience — the full policy above governs in any conflict.

- **What we collect**: your account info, what you book, who you message, how you use the app, and your IP/device.
- **Why**: to run the marketplace, take payments, send you confirmations, fight abuse, and (with your consent) improve the product.
- **Who we share with**: Supabase (database), Stripe (payments), PostHog (analytics — opt-in only), Sentry (errors — opt-in only), Resend (email), Lovable (hosting), Google/Apple (only if you log in with them).
- **We never**: sell your data, share with advertisers, or send marketing without your opt-in.
- **You can always**: see your data, correct it, delete it, export it, and opt out of analytics — email circlomanagement@circloclub.com.
- **We registered with the Privacy Authority?** No — Amendment 13 doesn't require it for our type of business.
- **Kids**: 13+ only; under 18 needs a parent's signature on the waiver.
- **If something goes wrong**: we'll tell the Privacy Authority "without delay" and email you if it could harm you.

---

**[END OF DRAFT v0.1]**

**To-do before publication:**
1. Insert all `[VERIFY: ...]` values (~14 places).
2. Confirm Supabase region (drives EU adequacy reasoning in §6).
3. Confirm chat retention policy (§8) — business decision.
4. Have a licensed Israeli privacy attorney review against Amendment 13 + 2017 Security Regulations + Section 30A.
5. Translate to Hebrew (next step in pipeline).
6. Once Hebrew is final, declare Hebrew as language of record (per header).
7. Add `Last updated` date.
8. Ensure the cookie banner UI matches what's described in §10 (essential always-on, analytics opt-in only, equal-weight Accept/Reject buttons, dismissal-as-refusal).
