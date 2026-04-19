import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  /** Parsed FAQ array from `coach_profiles.faqs`. Renders nothing when empty. */
  items: FAQItem[] | null | undefined;
}

/**
 * Expandable Q&A list (Phase 2.3.I). Hides itself when the coach hasn't
 * added any FAQs — no empty-state noise.
 */
const CoachFAQ = ({ items }: Props) => {
  const list = Array.isArray(items) ? items.filter((f) => f.question && f.answer) : [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (list.length === 0) return null;

  return (
    <section>
      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 flex items-center gap-1.5">
        <HelpCircle className="h-3 w-3 text-[#46f1c5]" />
        FAQ
      </h4>
      <ul className="divide-y divide-border/30 rounded-2xl border border-border/40 bg-card overflow-hidden">
        {list.map((item, i) => {
          const open = openIdx === i;
          return (
            <li key={`${item.question}-${i}`}>
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-foreground/5 transition-colors"
              >
                <span className="text-sm font-bold text-foreground">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </button>
              <div
                id={`faq-panel-${i}`}
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default CoachFAQ;
