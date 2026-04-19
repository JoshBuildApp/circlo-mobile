import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface EndOfScrollProps {
  /** Copy shown to the user — varies per page. */
  message?: string;
  /** Scroll container to scroll back to top. Defaults to window. */
  targetSelector?: string;
  className?: string;
}

/**
 * End-of-scroll intentional block. Rendered at the bottom of in-app pages so
 * the user sees a designed full-stop instead of an empty gap or marketing
 * footer.
 *
 * Fades in the first time the user actually hits the end (IntersectionObserver
 * — so it doesn't render as a permanent footer).
 */
const EndOfScroll = ({
  message = "More coaches are coming soon…",
  targetSelector,
  className = "",
}: EndOfScrollProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollToTop = () => {
    const target = targetSelector ? document.querySelector(targetSelector) : null;
    if (target) {
      target.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-5"
      >
        <div
          aria-hidden
          className="h-px w-16 bg-gradient-to-r from-transparent via-border to-transparent"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
          {message}
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-border/60 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Back to top
        </button>
      </motion.div>
    </div>
  );
};

export default EndOfScroll;
