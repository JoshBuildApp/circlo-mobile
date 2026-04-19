import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxItem {
  id: string;
  src: string;
  type: "image" | "video";
  alt?: string;
  caption?: string;
}

interface MediaLightboxProps {
  items: LightboxItem[];
  /** Index into `items`. `null` hides the lightbox. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

/**
 * Full-screen media viewer used on the coach profile (Phase 2.3.F). Keyboard
 * navigation (← → Esc), swipeable via arrow buttons, supports videos with
 * native controls. Reuses the app's modal z-stack.
 */
const MediaLightbox = ({ items, index, onClose, onIndexChange }: MediaLightboxProps) => {
  const open = index !== null;
  const current = index !== null ? items[index] : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index! - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index! + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasPrev, hasNext, index, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          role="dialog"
          aria-label="Media viewer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close media viewer"
            className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10 app-top-nav"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                disabled={!hasPrev}
                onClick={(e) => { e.stopPropagation(); if (hasPrev) onIndexChange(index! - 1); }}
                aria-label="Previous media"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={(e) => { e.stopPropagation(); if (hasNext) onIndexChange(index! + 1); }}
                aria-label="Next media"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[88vh] max-w-[92vw] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === "video" ? (
              <video
                src={current.src}
                controls
                autoPlay
                playsInline
                className="max-h-[82vh] max-w-full rounded-xl shadow-2xl bg-black"
              />
            ) : (
              <img
                src={current.src}
                alt={current.alt || "Media"}
                className="max-h-[82vh] max-w-full rounded-xl shadow-2xl object-contain"
                loading="lazy"
              />
            )}
            {current.caption && (
              <p className="text-sm text-white/80 text-center max-w-[min(80ch,92vw)]">
                {current.caption}
              </p>
            )}
            {items.length > 1 && (
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
                {index! + 1} / {items.length}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaLightbox;
