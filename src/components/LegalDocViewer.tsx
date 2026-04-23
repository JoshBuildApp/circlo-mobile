// Renders a legal markdown document from src/legal/{en,he}/ at the user's
// active i18n language. The .md files are imported as raw strings via Vite's
// `?raw` query so they ship with the bundle (no runtime fetch).
//
// Single source of truth: ~/circlo-legal/drafts-{en,he}/ — those files are
// copied verbatim into src/legal/ here. To update a document, edit the
// canonical version in ~/circlo-legal/ and re-copy.

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// English versions
import termsEn from "@/legal/en/01-terms-of-service.md?raw";
import privacyEn from "@/legal/en/02-privacy-policy.md?raw";
import cookiesEn from "@/legal/en/03-cookie-policy.md?raw";
import coachEn from "@/legal/en/04-coach-agreement.md?raw";
import waiverEn from "@/legal/en/05-trainee-waiver.md?raw";
import refundEn from "@/legal/en/06-refund-cancellation-policy.md?raw";
import aupEn from "@/legal/en/07-acceptable-use-policy.md?raw";
import accessEn from "@/legal/en/08-accessibility-statement.md?raw";

// Hebrew versions
import termsHe from "@/legal/he/01-terms-of-service.md?raw";
import privacyHe from "@/legal/he/02-privacy-policy.md?raw";
import cookiesHe from "@/legal/he/03-cookie-policy.md?raw";
import coachHe from "@/legal/he/04-coach-agreement.md?raw";
import waiverHe from "@/legal/he/05-trainee-waiver.md?raw";
import refundHe from "@/legal/he/06-refund-cancellation-policy.md?raw";
import aupHe from "@/legal/he/07-acceptable-use-policy.md?raw";
import accessHe from "@/legal/he/08-accessibility-statement.md?raw";

export type LegalDocId =
  | "terms-of-service"
  | "privacy-policy"
  | "cookie-policy"
  | "coach-agreement"
  | "trainee-waiver"
  | "refund-cancellation"
  | "acceptable-use"
  | "accessibility-statement";

const DOCS: Record<LegalDocId, { en: string; he: string; titleEn: string; titleHe: string }> = {
  "terms-of-service":     { en: termsEn,   he: termsHe,   titleEn: "Terms of Service",          titleHe: "תנאי שימוש" },
  "privacy-policy":       { en: privacyEn, he: privacyHe, titleEn: "Privacy Policy",            titleHe: "מדיניות פרטיות" },
  "cookie-policy":        { en: cookiesEn, he: cookiesHe, titleEn: "Cookie Policy",             titleHe: "מדיניות עוגיות" },
  "coach-agreement":      { en: coachEn,   he: coachHe,   titleEn: "Coach Agreement",           titleHe: "הסכם מאמן" },
  "trainee-waiver":       { en: waiverEn,  he: waiverHe,  titleEn: "Trainee Waiver",            titleHe: "כתב ויתור והשתתפות בסיכון" },
  "refund-cancellation":  { en: refundEn,  he: refundHe,  titleEn: "Refund & Cancellation",     titleHe: "מדיניות ביטולים והחזרים" },
  "acceptable-use":       { en: aupEn,     he: aupHe,     titleEn: "Acceptable Use Policy",     titleHe: "מדיניות שימוש מותר" },
  "accessibility-statement": { en: accessEn, he: accessHe, titleEn: "Accessibility Statement", titleHe: "הצהרת נגישות" },
};

interface LegalDocViewerProps {
  docId: LegalDocId;
}

export function LegalDocViewer({ docId }: LegalDocViewerProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isHebrew = i18n.language?.startsWith("he");
  const doc = DOCS[docId];
  const content = isHebrew ? doc.he : doc.en;
  const title = isHebrew ? doc.titleHe : doc.titleEn;
  const dir = isHebrew ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-background pb-24" dir={dir}>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className={isHebrew ? "h-4 w-4 text-foreground rotate-180" : "h-4 w-4 text-foreground"} />
        </button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>

      <article className="px-4 prose prose-sm dark:prose-invert max-w-none
                          prose-headings:font-heading prose-headings:font-bold
                          prose-h1:text-xl prose-h2:text-base prose-h3:text-sm
                          prose-p:text-sm prose-p:leading-relaxed
                          prose-li:text-sm
                          prose-strong:text-foreground
                          prose-table:text-xs prose-table:my-3
                          prose-th:font-semibold prose-th:text-left
                          prose-blockquote:border-l-4 prose-blockquote:border-amber-500
                          prose-blockquote:bg-amber-500/5 prose-blockquote:py-2 prose-blockquote:px-3
                          prose-blockquote:rounded-r-md prose-blockquote:not-italic
                          prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
