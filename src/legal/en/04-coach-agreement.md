# Circlo — Coach Agreement

> **DRAFT v1.1 — PENDING LAWYER REVIEW**
> Generated 2026-04-23, revised same day. Built using `legal-agreement`, `israeli-id-validator`, `israeli-payroll-calculator`, `cardcom-payment-gateway`, and `green-invoice` skills.
> Must be reviewed by a licensed Israeli attorney (orech din specializing in mishpat tzarchani / labor law / marketplace contracts) before publication. AI-drafted starting point only — not legal advice.

**Last updated:** [VERIFY date of publication]
**Version:** 1.2 draft
**Language of record:** Hebrew (the Hebrew translation governs in case of conflict)
**Changelog from v0.1:** added Coach identity-verification clause (Teudat Zehut/company-number validation §3.6), expanded payroll-classification context (§3), added Cardcom as alternative IL payment processor (§4), added Green Invoice / Morning option for Coach receipts (§5.3 / §5.6), added cross-link to Accessibility Statement
**Changelog v1.1 → v1.2:** **commission rate raised from 3.5% to 5%** (§5.1). Payment-processor fees now absorbed by Circlo out of the 5% — Coach not separately charged for processing on standard IL payments (§5.2). New §5.2.1 lists pass-through edge cases (foreign cards, tourist cards, chargebacks where Coach at fault).
**Governing law:** Israeli law
**Jurisdiction:** Competent courts in Tel Aviv–Jaffa District

---

## 1. Parties

This Coach Agreement ("Agreement") is between:

- **Circlo** — operated by **Guy Avnaim**, registered as עוסק מורשה (osek murshe) in Israel under מספר עוסק [VERIFY], at [VERIFY: registered business address] ("**Circlo**"); and
- **The Coach** — the individual (or entity, if Coach operates through a registered business) who accepts this Agreement at coach onboarding ("**Coach**").

By checking the acceptance box at coach onboarding, Coach confirms that they have read, understood, and agreed to be bound by this Agreement, the Circlo Terms of Service, and the Privacy Policy.

---

## 2. Recitals

WHEREAS Circlo operates an online marketplace at https://circloclub.com that connects sports trainees with independent sports coaches (the "**Platform**");

WHEREAS Coach wishes to use the Platform to offer their independent sports coaching services to Trainees;

WHEREAS Circlo wishes to enable Coach's offering on the Platform on the terms below;

NOW THEREFORE, the parties agree:

---

## 3. Independent Contractor Status — NOT Employment

3.1 Coach is engaged as an **independent contractor**. Nothing in this Agreement creates an employer–employee relationship, an agency, a partnership, a joint venture, or a franchise. Coach is not entitled to any of the rights granted to an employee under the Israeli labor laws — including but not limited to: severance pay (פיצויי פיטורין), holiday pay (חופשה שנתית), recreation pay (דמי הבראה), sick pay (דמי מחלה), pension contributions (פנסיה חובה), or convalescence pay.

3.2 **Each party is responsible for its own taxes and contributions**, including:
- Income tax (מס הכנסה)
- National Insurance contributions (ביטוח לאומי)
- Health tax (מס בריאות)
- VAT (מע"מ) where applicable

3.3 Coach acknowledges they are solely responsible for issuing tax invoices (חשבונית מס or חשבונית מס/קבלה for osek murshe; חשבונית עסקה for osek patur; or company invoice if Coach operates through a registered company) to Trainees in accordance with their own tax classification. Circlo will issue tax invoices to Coach for the platform commission Circlo retains (Section 5.1 below).

3.4 Coach controls when, where, how, and with whom they deliver coaching sessions, subject only to the Code of Conduct in Section 8 and to bookings Coach has accepted on the Platform.

3.5 Coach may use the Platform alongside any other coaching channel (their own website, other marketplaces, gym contracts, etc.). This Agreement is **non-exclusive**.

[VERIFY with counsel: Israeli courts apply a multi-factor "integration test" (מבחן ההשתלבות) to recharacterize contractor relationships as employment. The factors above (own tools, own schedule, multi-client, no benefits) are designed to satisfy that test, but counsel should confirm given Circlo's specific facts.]

### 3.6 Coach Identity & Tax Classification (added in v1.1)
At onboarding, Coach must provide and Circlo must validate:

(a) **Israeli ID** — Teudat Zehut (תעודת זהות) for individual Coaches, validated by checksum (per Israeli ID validation algorithm); or
(b) **Company / NPO number** for Coaches operating through a registered legal entity (validated against the Israeli Registrar of Companies / Amutot format); and
(c) **Tax classification** — one of:
- עוסק פטור (osek patur) — small turnover; no VAT collection
- עוסק מורשה (osek murshe) — VAT collection required
- חברה בע"מ (private company) — corporate tax + VAT
- עמותה (registered NPO)
- Other [VERIFY]

Coach acknowledges that misrepresentation of legal status — including using an osek-patur classification while exceeding the annual turnover ceiling, or operating without a required business registration — exposes Coach to penalties under Israeli tax law (פקודת מס הכנסה + חוק מע"מ) and may result in Circlo terminating this Agreement.

### 3.7 Bituach Leumi (National Insurance) Reminder
Coach is solely responsible for declaring earnings to **ביטוח לאומי** in the appropriate self-employed (עצמאי) classification. Failure to do so does not create any obligation on Circlo. The bituach-leumi rate as of 2026 for self-employed is approximately [VERIFY current rates: typically 3.1%–10% by income tier, plus health tax 3%–5%]; Coach should consult their accountant or use the official בטל"א online calculator.

---

## 4. Payment Processing & Payouts (Stripe Connect Primary; Cardcom Alternative)

4.1 Before Coach's first paid booking, Coach must complete **Stripe Connect** onboarding, including Stripe's identity verification (KYC), bank account verification, and acceptance of Stripe's Connected Account Agreement.

[VERIFY: Circlo may, in the future, offer Coaches the alternative of receiving payouts via **Cardcom** (a leading Israeli payment processor with native Hebrew support and ILS-denominated payouts). If Cardcom is added, this Agreement will be updated and Coach will be notified before that alternative becomes available; existing Stripe Connect arrangements will be honored.]

4.2 Stripe is a separate service provider with its own terms. Circlo does not control Stripe's verification timelines, payout schedules, or account decisions. If Stripe declines to onboard Coach or freezes Coach's connected account, Circlo cannot pay Coach and may suspend Coach's listings.

4.3 **Payout cadence.** Subject to Stripe's payout schedule and any holds for disputed transactions, Circlo will release payment to Coach's verified bank account [VERIFY: 7] business days after a session is marked completed. The payout amount equals the Trainee-paid price minus Circlo's platform fee (Section 5) and any payment-processor fees passed through.

4.4 Coach is responsible for providing accurate bank details. Circlo is not liable for failed payouts caused by incorrect bank details Coach has supplied.

---

## 5. Commission & Fees

5.1 **Circlo platform fee.** Circlo retains **5% (five percent)** of the gross price of each booking made through the Platform. This fee covers Platform operation, support, payment infrastructure, content moderation, trust-and-safety overhead, **AND the Israeli payment-processor fees** (currently routed via Grow / Stripe). Coach is not separately charged for payment processing on standard Israeli credit-card, digital-wallet, Bit, or PayBox transactions — those processing costs are absorbed by Circlo from the 5%.

5.2 **Payment-processor fees — absorbed by Circlo.** For standard Israeli payment methods (credit cards, digital wallets, Bit, PayBox, bank transfer), the payment-processor fees charged by Circlo's payment partners (currently Grow / Stripe Connect) are **absorbed by Circlo out of the 5% platform fee** and are NOT separately deducted from Coach's payout. Coach receives Trainee-paid price minus only the 5% Circlo platform fee.

5.2.1 **Exceptions — fees that may be passed through to Coach** in the rare cases listed below, with prior notice. All Grow rates below are confirmed by Grow as of 2026-04-23.
- **Tourist / prepaid traveler cards (כרטיס תייר)** — Grow charges **3.5% total** (no additional fee on top). Because this exceeds Circlo's 5% commission less Circlo's normal margin, Circlo will **decline tourist cards at checkout** as the default policy. If accepted in a special case, the entire 3.5% is passed through to the Coach.
- **Foreign-issued credit cards** — Grow has indicated their non-IL card rate is the same **3.5%** as tourist cards [VERIFY: confirm Grow doesn't have a separate cross-border tier for regular Visa/Mastercard issued by a foreign bank vs. prepaid tourist cards]. Treatment same as tourist cards above.
- **Diners Club** — Grow charges 1.5% processing fee. Circlo currently absorbs this; Circlo reserves the right to pass through if Diners Club becomes a material share of volume.
- **Chargeback fees** — Grow charges **₪55 per chargeback / סטורנו**, regardless of the outcome of the dispute (i.e. the fee is charged even if the merchant wins the dispute). Where the underlying issue is the Coach's responsibility (e.g. Coach no-show, Coach misrepresentation, Coach failure to deliver), the ₪55 will be deducted from Coach's next payout.

5.3 **Tax invoices.** Circlo will issue Coach a monthly tax invoice (חשבונית מס) for the total platform fee retained during that month, in compliance with Israeli VAT requirements. From the e-invoicing reform (allocation numbers — מספר הקצאה), Coach acknowledges that Circlo's invoices may include allocation numbers obtained from Reshut HaMisim where the law requires, and Coach's own invoices to Trainees may need to do the same once thresholds apply to them. [VERIFY current threshold: ₪10,000 from Jan 2026, ₪5,000 from June 2026.]

**Recommended invoicing tools for Coach (added in v1.1):** Coach may use any compliant invoicing solution. Circlo recommends **Green Invoice (Morning)** or comparable Israeli SaaS that supports automatic allocation-number requests, חשבונית מס/קבלה generation, and integration with Reshut HaMisim. Use of Green Invoice is at Coach's option and cost.

5.4 **Pricing control.** Coach sets their own session prices on the Platform, subject to any minimum or maximum bounds Circlo may establish from time to time. Prices must be displayed including VAT, in accordance with Israeli Consumer Protection Law.

5.5 **Off-platform circumvention is prohibited.** If Coach uses the Platform to identify or initially connect with a Trainee and then takes the booking off-platform to avoid Circlo's commission, that constitutes a material breach of this Agreement. Circlo may invoice Coach for the commission Circlo would have earned, suspend Coach's account, and pursue all other remedies.

---

## 6. Coach's Representations About Credentials

6.1 By creating a Coach profile, Coach represents and warrants that:
(a) Coach has the **knowledge, skill, qualifications, certifications, licenses, and (where required) insurance** to deliver each sport listed on Coach's profile to a reasonable standard of care.
(b) Where Israeli law — including the Sports Law 5748-1988 (חוק הספורט תשמ"ח-1988), federation regulations, or sport-specific licensing rules — **requires a particular certification or license** (e.g. lifeguarding, scuba, certain combat sports), Coach holds the required certification and will produce proof on Circlo's request.
(c) Coach has **no criminal conviction** that would, under Israeli law, disqualify them from working with the public, particularly with minors. [VERIFY: certain coaching contexts (especially with minors) may require an "אישור היעדר עבירות מין" — certificate of no sexual-offense convictions — under the Prevention of Employment of Sex Offenders in Institutions Catering to Minors Law 5761-2001. Counsel to confirm Circlo's obligation to require this.]
(d) Coach has any required work authorization or business license to operate in Israel.

6.2 **Circlo's "Verified" badge** (where displayed) means Circlo has performed limited credential checks. It is **not a guarantee** of competence, safety, or character. Coach acknowledges that the Verified badge does not transfer Circlo any liability for Coach's actual conduct.

6.3 Circlo may revoke a Verified badge or suspend Coach's listing at any time if Circlo has reasonable concern about Coach's credentials, conduct, or safety.

---

## 7. Coach Insurance — Strongly Recommended

7.1 Coach is **strongly encouraged** to carry their own professional liability insurance (ביטוח אחריות מקצועית), general liability insurance (ביטוח אחריות כלפי צד שלישי), and any sport-specific insurance required by Israeli law or by the venue where sessions are conducted.

7.2 Coach is solely responsible for any injury, damage, or loss caused to a Trainee, third party, or property during or in connection with a session. Circlo is not Coach's insurer and does not guarantee coverage for Coach's activities.

[VERIFY: at launch, Circlo does not require proof of Coach insurance. Counsel should advise whether to make insurance proof mandatory for high-risk sports (boxing, MMA, swimming, climbing, scuba) before such bookings can be accepted.]

---

## 8. Code of Conduct

Coach agrees to:

(a) Treat all Trainees with respect, professionalism, and without discrimination on grounds of race, religion, gender, sexual orientation, age, disability, national origin, or any other protected characteristic;
(b) Respond to Trainee messages within a reasonable time (target: within 24 hours) when a booking inquiry is pending;
(c) Show up on time to confirmed sessions; if Coach must cancel, provide as much notice as possible (per the Cancellation Policy in the Terms of Service);
(d) Not solicit Trainees off-platform to avoid Circlo's commission (per Section 5.5);
(e) Not request or receive payment from a Trainee outside the Platform's payment system for a session that originated on the Platform;
(f) Not harass, threaten, dox, or send unsolicited commercial messages to Trainees outside the booking context;
(g) Not engage in sexual or romantic conduct with a minor Trainee, ever; refrain from any such conduct with adult Trainees that violates professional norms;
(h) Comply with all Israeli laws applicable to the chosen sport, including safety regulations and (where applicable) הוראות חוק הספורט;
(i) Maintain accurate profile information and correct any inaccuracies promptly.

---

## 9. Coach Content & License

9.1 **Ownership.** Coach retains ownership of all content Coach uploads to the Platform — videos, posts, photos, profile bio, certifications shown, and likeness in such content ("**Coach Content**").

9.2 **License to Circlo.** Coach grants Circlo a **worldwide, royalty-free, non-exclusive, sublicensable license** to host, store, reproduce, display, distribute, modify (for technical purposes such as resizing, encoding, transcoding, and translation), and promote the Coach Content on and through the Platform and Circlo's marketing channels (website, email, social media, paid advertising) for the duration that the content remains on the Platform plus a reasonable period thereafter for backups and for content already shared by users.

9.3 **Removal.** Coach may remove specific Coach Content at any time. Removal terminates the license going forward, except (a) for backup copies retained for a reasonable period, and (b) for content already shared, downloaded, re-posted by other users, or used in published Circlo marketing prior to removal.

9.4 **Third-party rights.** Coach represents that Coach owns or has the necessary rights to all Coach Content, including consent of any identifiable people appearing in it. Coach indemnifies Circlo against any claim arising from a violation of this representation (Section 11).

---

## 10. Trust & Safety, Suspension, Termination

10.1 **Termination for convenience.** Either party may terminate this Agreement on 30 days' written notice (email is sufficient).

10.2 **Termination for cause — immediate.** Circlo may suspend or terminate Coach's account immediately, without notice, on reasonable belief that Coach has:
(a) Materially breached this Agreement and not cured within 14 days of notice (where curable);
(b) Engaged in **fraud, harassment, off-platform circumvention, or any criminal conduct**;
(c) Misrepresented credentials in a material way;
(d) Created a serious safety risk to a Trainee or third party;
(e) Become subject to a regulatory order, civil judgment, or criminal proceeding that materially affects Coach's ability to perform safely.

10.3 **Effect of termination.** On termination:
(a) Coach's listings are removed from public view;
(b) Already-confirmed bookings will be honored or refunded per the Cancellation Policy;
(c) Coach's pending payouts will be released subject to any holds for disputed transactions or chargebacks;
(d) Sections 9.2 (license to already-shared content), 11 (indemnity), 12 (confidentiality), 13 (limitation of liability), and 14 (dispute resolution) survive.

10.4 Circlo will give Coach reasonable notice of suspension where doing so does not jeopardize safety, ongoing investigation, or compliance with law.

---

## 11. Indemnity

Coach shall indemnify, defend, and hold harmless Circlo (and its operator Guy Avnaim) from and against any claim, loss, damage, fine, cost, or expense (including reasonable attorneys' fees) arising from:
(a) Coach's breach of this Agreement;
(b) Coach's negligence, gross negligence, or willful misconduct;
(c) Coach's misrepresentation of credentials;
(d) Any injury, damage, or loss caused to a Trainee, third party, or property during or in connection with Coach's session;
(e) A claim that Coach Content infringes a third party's IP, privacy, publicity, or other right;
(f) Coach's violation of any Israeli law applicable to the sport.

---

## 12. Confidentiality

12.1 Coach may receive confidential information from Circlo or about other Coaches/Trainees through the Platform. Coach agrees not to disclose or use such information except for performing under this Agreement.

12.2 The obligation survives termination for [VERIFY: 3] years.

12.3 Standard exceptions apply: information that is public through no fault of Coach, was already known to Coach, was independently developed, or is required to be disclosed by law (with prompt notice to Circlo).

---

## 13. Limitation of Liability

13.1 Subject to Section 13.2, Circlo's total aggregate liability to Coach under or in connection with this Agreement is capped at the greater of **₪500** or **the platform fees Circlo retained from Coach's bookings in the 12 months preceding the claim**.

13.2 **Non-waivable rights.** Nothing in this Section 13 limits liability for matters that cannot lawfully be limited under Israeli law, including fraud, willful misconduct, or personal injury caused by gross negligence.

13.3 Neither party is liable to the other for indirect, incidental, special, consequential, or punitive damages.

[VERIFY: Standard Form Contracts Law (חוק חוזים אחידים תשמ"ג-1982) presumes overly broad liability caps to be unfair. Counsel must confirm survivability of Section 13.1 specifically against Section 4 of that law.]

---

## 14. Dispute Resolution

14.1 The parties shall first attempt good-faith resolution via email to circlomanagement@circloclub.com within [VERIFY: 30] days of dispute.

14.2 This Agreement is governed by Israeli law, without regard to conflict-of-laws rules.

14.3 The competent courts of the **Tel Aviv–Jaffa District** have exclusive jurisdiction.

---

## 15. General Provisions

15.1 **Amendments.** Circlo may amend this Agreement on 14 days' notice to Coach (email + in-app notice). Continued use of the Platform after the effective date constitutes acceptance. If Coach does not accept, Coach may terminate per Section 10.1.

15.2 **Entire agreement.** This Agreement, together with the Terms of Service, Privacy Policy, Acceptable Use Policy, and any documents referenced therein, is the entire agreement between Coach and Circlo on its subject matter.

15.3 **Severability.** If any provision is found unenforceable, the rest remains in force.

15.4 **No waiver.** Failure to enforce a provision does not waive future enforcement.

15.5 **Notices.** Email notices to Coach's registered email address are sufficient. Notices to Circlo go to circlomanagement@circloclub.com.

15.6 **Assignment.** Coach may not assign this Agreement without Circlo's written consent. Circlo may assign in connection with a sale of substantially all of its business.

15.7 **Acceptance method & record.** Coach accepts this Agreement by clickwrap at coach onboarding. Circlo records the version, timestamp, and IP address of acceptance in its database for audit purposes.

---

## 16. Contact

**Operator:** Guy Avnaim, registered עוסק מורשה
**Trade name:** Circlo
**Osek murshe number:** [VERIFY]
**Address:** [VERIFY]
**Email:** circlomanagement@circloclub.com
**Phone:** [VERIFY]

---

## Plain-Language Summary

For convenience — the full Agreement above governs in any conflict.

- **You're a contractor, not an employee.** No salary, no benefits, no severance. You handle your own taxes + ביטוח לאומי.
- **Circlo's cut is 5%** of every booking — that's the all-in number for standard Israeli payments (credit, Bit, PayBox, bank transfer). We absorb the payment-processor fees out of that 5%.
- **Edge cases that may pass through:** foreign credit cards, tourist cards, Diners (rare), chargeback fees when the dispute is your fault. We'll tell you in advance.
- **Stripe holds your bank info**, not Circlo. You complete Stripe's onboarding before your first payout.
- **Don't take Trainees off-platform** to skip the commission. That's a breach.
- **You set your prices** (including 18% VAT). You issue your own tax receipts to Trainees.
- **You're responsible for your own conduct** — credentials, insurance, behavior, sport-specific licenses.
- **Get insurance.** Strongly recommended; we may require it for high-risk sports.
- **30 days notice** to leave. We can suspend immediately for fraud, harassment, criminal conduct, or off-platform circumvention.
- **You own your videos and content.** You give Circlo a license to display them while you're on the Platform.
- **Disputes** go to Tel Aviv courts under Israeli law.

---

**[END OF DRAFT v0.1]**

**To-do before publication:**
1. Insert all `[VERIFY: ...]` values (~12 places).
2. Decide whether to require proof of insurance for high-risk sports (boxing, MMA, swimming, climbing, scuba) before allowing such listings.
3. Decide whether to require certificate of no sexual-offense convictions (אישור היעדר עבירות מין) for any Coach who lists sessions for minors. Strongly recommended given Israeli law for institutions catering to minors.
4. Have a licensed Israeli attorney review for: integration-test compliance (Section 3), Standard Form Contracts Law compliance (Sections 5, 11, 13), Stripe Connect agreement consistency (Section 4), labor law boundaries (Section 3).
5. Translate to Hebrew (next step in pipeline).
6. Once Hebrew is final, declare Hebrew as language of record (per header).
