import { AlertTriangle, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cancellationPolicy, useBookingActions } from "@/hooks/use-booking-actions";

interface Props {
  open: boolean;
  booking: { id: string; coach_name: string; date: string; time: string; price: number | null } | null;
  onClose: () => void;
  onCancelled?: () => void;
}

/**
 * Cancellation confirm sheet (Phase 4.4). Shows the computed policy clearly
 * BEFORE the user commits so there are no surprise fees.
 */
const CancelBookingDialog = ({ open, booking, onClose, onCancelled }: Props) => {
  const { working, cancelBooking } = useBookingActions();
  if (!booking) return null;

  const policy = cancellationPolicy(booking.date, booking.time);
  const fee = policy.feePercent > 0 && booking.price != null
    ? Math.round((booking.price * policy.feePercent) / 100)
    : 0;

  const handleConfirm = async () => {
    const ok = await cancelBooking(booking.id);
    if (ok) {
      onClose();
      onCancelled?.();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="alertdialog"
            aria-label="Cancel booking"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[min(92vw,420px)] rounded-2xl bg-card border border-border/40 shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    policy.isFree ? "bg-[#46f1c5]/15 text-[#46f1c5]" : "bg-amber-500/15 text-amber-500"
                  }`}>
                    {policy.isFree ? <Clock className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">Cancel this booking?</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                      {booking.coach_name} · {new Date(booking.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="h-8 w-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`rounded-xl border p-3 ${
                policy.isFree
                  ? "border-[#46f1c5]/30 bg-[#46f1c5]/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}>
                {policy.isFree ? (
                  <p className="text-sm text-foreground">
                    <span className="font-black text-[#46f1c5]">Free cancellation.</span>{" "}
                    You're cancelling more than 24 hours before the session — no fee applies.
                  </p>
                ) : policy.feePercent === 100 ? (
                  <p className="text-sm text-foreground">
                    <span className="font-black text-destructive">No-show:</span>{" "}
                    The session time has already passed — cancelling now is treated as a no-show
                    {booking.price != null ? ` (₪${booking.price}).` : "."}
                  </p>
                ) : (
                  <p className="text-sm text-foreground">
                    <span className="font-black text-amber-500">{policy.feePercent}% fee applies.</span>{" "}
                    The session starts in under 24 hours
                    {fee > 0 ? ` — cancellation fee: ₪${fee}.` : "."}
                  </p>
                )}
                <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                  Policy: Free until 24h before · 50% within 24h · 100% after start.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={working}
                  className="flex-1 h-11 rounded-lg bg-muted/40 text-foreground text-[11px] font-black uppercase tracking-[0.18em] active:scale-95 transition-transform disabled:opacity-60"
                >
                  Keep booking
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={working}
                  aria-busy={working}
                  className="flex-1 h-11 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-black uppercase tracking-[0.18em] active:scale-95 transition-transform disabled:opacity-70"
                >
                  {working ? "Cancelling…" : "Cancel booking"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CancelBookingDialog;
