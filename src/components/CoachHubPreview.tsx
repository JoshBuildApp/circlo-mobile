import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PublicCoachProfile from "@/pages/PublicCoachProfile";

interface CoachHubPreviewProps {
  coachProfileId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Coach hub edit-mode overlay.
 * Opens PublicCoachProfile in full edit mode (drag sections, toggle visibility,
 * add sections, save layout). No phone frame — the whole viewport is the canvas
 * so coaches have room to drag and drop comfortably.
 */
const CoachHubPreview = ({ coachProfileId, open, onClose }: CoachHubPreviewProps) => {
  const navigate = useNavigate();

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const handleExit = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 overflow-y-auto"
          >
            <PublicCoachProfile
              isPreview
              isEditing
              previewCoachId={coachProfileId}
              onExitEdit={handleExit}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachHubPreview;
