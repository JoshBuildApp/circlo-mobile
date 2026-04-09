import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewPostsPillProps {
  count: number;
  onClick: () => void;
  className?: string;
}

/**
 * Floating pill that appears when new content arrives.
 * Tap to refresh and scroll to top.
 */
const NewPostsPill = ({ count, onClick, className = "" }: NewPostsPillProps) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.button
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 active:scale-95 transition-transform ${className}`}
      >
        <ArrowUp className="h-3.5 w-3.5" />
        <span>
          {count === 1 ? "1 new post" : `${count} new posts`}
        </span>
      </motion.button>
    )}
  </AnimatePresence>
);

export default NewPostsPill;
