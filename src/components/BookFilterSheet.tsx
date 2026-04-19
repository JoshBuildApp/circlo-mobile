import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookFilters {
  sports: string[];
  priceMin: number;
  priceMax: number;
  minRating: number;
  availability: "any" | "today" | "this-week";
  sessionType: "any" | "one-on-one" | "group" | "online";
}

export const DEFAULT_BOOK_FILTERS: BookFilters = {
  sports: [],
  priceMin: 0,
  priceMax: 500,
  minRating: 0,
  availability: "any",
  sessionType: "any",
};

export function countActive(f: BookFilters): number {
  let c = 0;
  if (f.sports.length > 0) c++;
  if (f.priceMin > 0 || f.priceMax < 500) c++;
  if (f.minRating > 0) c++;
  if (f.availability !== "any") c++;
  if (f.sessionType !== "any") c++;
  return c;
}

const SPORTS = ["Padel","Tennis","Fitness","CrossFit","Boxing","MMA","Soccer","Basketball","Yoga","Swimming","Running"];

interface Props {
  open: boolean;
  value: BookFilters;
  onChange: (next: BookFilters) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet filter panel for the Book page (Phase 3.2). Mirrors Discover's
 * filter surface so a session-wide shared context is easy to slot in later.
 */
const BookFilterSheet = ({ open, value, onChange, onClose }: Props) => {
  const [local, setLocal] = useState<BookFilters>(value);

  useEffect(() => { if (open) setLocal(value); }, [open, value]);

  const toggleSport = (s: string) => {
    setLocal((prev) => ({
      ...prev,
      sports: prev.sports.includes(s) ? prev.sports.filter((v) => v !== s) : [...prev.sports, s],
    }));
  };

  const apply = () => { onChange(local); onClose(); };
  const reset = () => setLocal(DEFAULT_BOOK_FILTERS);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="Filter coaches"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed left-0 right-0 bottom-0 z-[9999] max-h-[85vh] rounded-t-3xl bg-background border-t border-border/40 shadow-2xl flex flex-col app-bottom-nav"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Filters</h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={reset}
                  className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground px-3 py-1"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close filters"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-foreground/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-3">Sports</h3>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => {
                    const active = local.sports.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSport(s)}
                        aria-pressed={active}
                        className={cn(
                          "h-9 px-4 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-colors",
                          active
                            ? "bg-gradient-kinetic text-white shadow-[0_6px_18px_rgba(0,212,170,0.2)]"
                            : "bg-card border border-border/40 text-muted-foreground"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="flex items-end justify-between mb-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">Price</h3>
                  <span className="text-[11px] font-black text-foreground">
                    ₪{local.priceMin} – ₪{local.priceMax}{local.priceMax >= 500 && "+"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Min
                    <input
                      type="range"
                      min={0} max={500} step={10}
                      value={local.priceMin}
                      onChange={(e) => setLocal((p) => ({ ...p, priceMin: Math.min(Number(e.target.value), p.priceMax) }))}
                      className="w-full mt-1 accent-[#46f1c5]"
                      aria-label="Minimum price"
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Max
                    <input
                      type="range"
                      min={0} max={500} step={10}
                      value={local.priceMax}
                      onChange={(e) => setLocal((p) => ({ ...p, priceMax: Math.max(Number(e.target.value), p.priceMin) }))}
                      className="w-full mt-1 accent-[#46f1c5]"
                      aria-label="Maximum price"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-2">Minimum rating</h3>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((r) => {
                    const active = local.minRating === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setLocal((p) => ({ ...p, minRating: r }))}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-[11px] font-black uppercase tracking-wider inline-flex items-center justify-center gap-1",
                          active
                            ? "bg-gradient-kinetic text-white"
                            : "bg-card border border-border/40 text-muted-foreground"
                        )}
                      >
                        {r === 0 ? "Any" : (
                          <>
                            <Star className="h-3 w-3 fill-current" />
                            {r.toFixed(r % 1 ? 1 : 0)}+
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-2">Availability</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "any", label: "Any" },
                    { key: "today", label: "Today" },
                    { key: "this-week", label: "This week" },
                  ].map((opt) => {
                    const active = local.availability === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setLocal((p) => ({ ...p, availability: opt.key as BookFilters["availability"] }))}
                        className={cn(
                          "h-10 rounded-lg text-[11px] font-black uppercase tracking-wider",
                          active ? "bg-gradient-kinetic text-white" : "bg-card border border-border/40 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-2">Session type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "any", label: "Any" },
                    { key: "one-on-one", label: "1-on-1" },
                    { key: "group", label: "Group" },
                    { key: "online", label: "Online" },
                  ].map((opt) => {
                    const active = local.sessionType === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setLocal((p) => ({ ...p, sessionType: opt.key as BookFilters["sessionType"] }))}
                        className={cn(
                          "h-10 rounded-lg text-[11px] font-black uppercase tracking-wider",
                          active ? "bg-gradient-kinetic text-white" : "bg-card border border-border/40 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Apply footer */}
            <div className="border-t border-border/30 p-4">
              <button
                type="button"
                onClick={apply}
                className="w-full h-12 rounded-xl bg-gradient-kinetic text-white text-[12px] font-black uppercase tracking-[0.18em] shadow-[0_10px_30px_rgba(0,212,170,0.25)] active:scale-[0.98] transition-transform"
              >
                Show results · {countActive(local)} filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookFilterSheet;
