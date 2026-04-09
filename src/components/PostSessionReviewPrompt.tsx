import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostSessionReview } from "@/hooks/use-post-session-review";
import { useCoachReviews } from "@/hooks/use-coach-reviews";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PostSessionReviewPrompt = () => {
  const { pendingReview, dismiss } = usePostSessionReview();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
      setTimeout(() => {
        dismiss(pendingReview.id);
        setSubmitted(false);
        setRating(0);
        setComment("");
      }, 1500);
    }
  };

  const handleDismiss = () => {
    if (!pendingReview) return;
    dismiss(pendingReview.id);
    setRating(0);
    setComment("");
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
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                </motion.div>
                <p className="text-base font-bold text-foreground">Thanks for your review!</p>
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
