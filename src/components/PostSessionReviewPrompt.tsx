import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostSessionReview } from "@/hooks/use-post-session-review";
import { useCoachReviews } from "@/hooks/use-coach-reviews";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESET_TIPS = [10, 20, 50, 100];

const PostSessionReviewPrompt = () => {
  const { pendingReview, dismiss } = usePostSessionReview();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Tipping state
  const [showTip, setShowTip] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const [sendingTip, setSendingTip] = useState(false);

  // Only init the review hook when we have a booking to review
  const coachId = pendingReview?.coach_id || "";
  const { submitReview, submitting } = useCoachReviews(coachId);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!pendingReview) return;

    const success = await submitReview(rating, comment);
    if (success) {
      setShowTip(true);
    }
  };

  const handleSendTip = async () => {
    if (!pendingReview || !user) return;
    const amount = selectedTip ?? (customTip ? parseInt(customTip, 10) : null);
    if (!amount || amount <= 0) {
      toast.error("Please select or enter a tip amount");
      return;
    }
    setSendingTip(true);
    const { error } = await supabase.from("tips" as any).insert({
      coach_id: pendingReview.coach_id,
      athlete_id: user.id,
      booking_id: pendingReview.id,
      amount,
      currency: "ILS",
    });
    setSendingTip(false);
    if (error) {
      toast.error("Failed to send tip");
    } else {
      toast.success("Tip sent! 🙌");
    }
    handleFinish();
  };

  const handleFinish = () => {
    if (!pendingReview) return;
    dismiss(pendingReview.id);
    setSubmitted(false);
    setRating(0);
    setComment("");
    setShowTip(false);
    setSelectedTip(null);
    setCustomTip("");
  };

  const handleDismiss = () => {
    if (!pendingReview) return;
    dismiss(pendingReview.id);
    setRating(0);
    setComment("");
    setShowTip(false);
    setSelectedTip(null);
    setCustomTip("");
  };

  return (
    <AnimatePresence>
      {pendingReview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {showTip ? (
              /* Tipping screen */
              <div className="px-5 pt-5 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-foreground">Leave a tip</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Show {pendingReview.coach_name} some love
                    </p>
                  </div>
                  <button
                    onClick={handleFinish}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Preset amounts */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_TIPS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setSelectedTip(amount); setCustomTip(""); }}
                      className={cn(
                        "h-12 rounded-xl text-sm font-bold border transition-all active:scale-95",
                        selectedTip === amount
                          ? "border-transparent text-white"
                          : "border-border bg-secondary text-foreground"
                      )}
                      style={selectedTip === amount ? { background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" } : {}}
                    >
                      ₪{amount}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₪</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Custom amount"
                    value={customTip}
                    onChange={(e) => { setCustomTip(e.target.value); setSelectedTip(null); }}
                    className={cn(
                      "w-full h-12 pl-8 pr-4 rounded-xl border bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
                      customTip && !selectedTip ? "border-orange-400" : "border-border"
                    )}
                  />
                </div>

                {/* Send Tip button */}
                <button
                  onClick={handleSendTip}
                  disabled={sendingTip || (!selectedTip && !customTip)}
                  className="w-full h-12 rounded-xl text-sm font-bold text-white active:scale-95 transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, hsl(18,100%,59%), hsl(5,100%,75%))" }}
                >
                  {sendingTip ? "Sending..." : "Send Tip"}
                </button>

                {/* Skip */}
                <button
                  onClick={handleFinish}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                  <div>
                    <p className="text-base font-bold text-foreground">
                      How was your session?
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      with {pendingReview.coach_name} &middot; {pendingReview.time_label}
                    </p>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Stars */}
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="p-1 active:scale-90 transition-transform"
                    >
                      <Star
                        className={cn(
                          "h-9 w-9 transition-colors",
                          (hoveredStar || rating) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <div className="px-5 pb-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    rows={3}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 px-5 pb-5">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 h-12 rounded-xl bg-secondary text-sm font-semibold text-muted-foreground active:scale-95 transition-transform"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || rating === 0}
                    className={cn(
                      "flex-1 h-12 rounded-xl text-sm font-semibold active:scale-95 transition-all",
                      rating > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostSessionReviewPrompt;
