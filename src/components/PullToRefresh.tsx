import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPulling, pullDistance, isRefreshing, handlers } = usePullToRefresh({ onRefresh });

  const showIndicator = isPulling || isRefreshing || pullDistance > 10;
  const progress = Math.min(pullDistance / 60, 1);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ overflowY: "auto", position: "relative" }}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            key="pull-indicator"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center py-3 pointer-events-none"
          >
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "#FF6B2B" }}
            >
              {isRefreshing ? (
                /* Spinning ring when actually refreshing */
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                /* Progress arc while pulling */
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: `rotate(${progress * 360}deg)`, transition: "transform 0.1s" }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="white"
                    strokeOpacity="0.3"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 3a9 9 0 019 9"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offset content while pulling */}
      <motion.div
        animate={{ y: showIndicator ? Math.min(pullDistance * 0.4, 24) : 0 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
