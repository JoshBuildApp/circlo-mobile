import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Calendar, Share2, ChevronRight, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { openExternal } from "@/lib/platform";
import { useHaptics } from "@/native/useNative";

interface BookingSuccessProps {
  coachName: string;
  sport: string;
  date: string;
  time: string;
  price: number;
  onClose: () => void;
}

// Enhanced confetti with multiple shapes and physics
const Confetti = () => {
  const colors = ["#00D4AA", "#FF6B2C", "#1A1A2E", "#FFD700", "#FF6B9D", "#6366F1", "#06B6D4"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: Math.random() * 100,
    delay: Math.random() * 1,
    size: Math.random() * 10 + 4,
    rotation: Math.random() * 720 - 360,
    drift: (Math.random() - 0.5) * 80,
    shape: Math.random() > 0.6 ? "circle" : Math.random() > 0.5 ? "star" : "rect",
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: "110vh",
            x: `${p.x + p.drift}vw`,
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotation,
            scale: [1, 1.2, 0.8],
          }}
          transition={{ duration: 3.5, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-0"
          style={{
            width: p.size,
            height: p.shape === "star" ? p.size : p.size * (p.shape === "rect" ? 1.5 : 1),
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "1px",
            boxShadow: `0 0 ${p.size}px ${p.color}44`,
          }}
        />
      ))}
    </div>
  );
};

// Animated ring burst behind the check icon
const RingBurst = () => (
  <>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        initial={{ scale: 0.3, opacity: 0.6 }}
        animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
        transition={{ delay: 0.2 + i * 0.15, duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 rounded-full"
        style={{
          border: `${2 - i * 0.5}px solid #00D4AA`,
          left: "50%",
          top: "50%",
          width: 80,
          height: 80,
          marginLeft: -40,
          marginTop: -40,
        }}
      />
    ))}
  </>
);

const BookingSuccessScreen = ({ coachName, sport, date, time, price, onClose }: BookingSuccessProps) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const { success } = useHaptics();

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    // Native success haptic on iOS/Android; web fallback to Vibration API.
    success();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    return () => clearTimeout(t);
  }, [success]);

  const addToCalendar = () => {
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Circlo+${sport}+Session+with+${coachName}&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
    openExternal(url);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Booked a session on Circlo!", text: `I just booked a ${sport} session with ${coachName} on Circlo!` });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      >
        {showConfetti && <Confetti />}

        <motion.div
          initial={{ scale: 0.7, y: 60, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 280, delay: 0.1 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden bg-background"
          style={{ boxShadow: "0 30px 100px rgba(0,212,170,0.15), 0 10px 40px rgba(0,0,0,0.4)" }}
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-90">
            <X size={14} />
          </button>

          {/* Animated gradient bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="h-1.5 w-full origin-left"
            style={{ background: "linear-gradient(90deg, #00D4AA, #06B6D4, #FF6B2C, #FFD700)" }}
          />

          <div className="p-8 text-center">
            {/* Check icon with ring burst */}
            <div className="relative mx-auto mb-6" style={{ width: 80, height: 80 }}>
              <RingBurst />
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 200 }}
                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center relative z-10"
                style={{ background: "linear-gradient(135deg, #00D4AA22, #00D4AA44)", border: "2.5px solid #00D4AA" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", damping: 10 }}
                >
                  <CheckCircle className="h-10 w-10 text-[#00D4AA]" />
                </motion.div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="font-black text-2xl text-foreground mb-1">You're booked!</h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
              >
                <Sparkles className="h-3 w-3" />
                Session confirmed with {coachName}
              </motion.div>
            </motion.div>

            {/* Booking summary card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 rounded-2xl p-4 text-left space-y-3"
              style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)" }}
            >
              {[
                { label: "Sport", value: sport, emoji: "" },
                { label: "Date", value: date, emoji: "" },
                { label: "Time", value: time, emoji: "" },
                { label: "Price", value: `₪${price}`, emoji: "" },
              ].map(({ label, value }, idx) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.08 }}
                  className="flex justify-between text-sm items-center"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold text-foreground">{value}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 space-y-3"
            >
              <button
                onClick={addToCalendar}
                className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #00D4AA, #FF6B2C)" }}
              >
                <Calendar size={16} /> Add to Calendar
              </button>

              {navigator.share && (
                <button
                  onClick={share}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-all active:scale-[0.97]"
                >
                  <Share2 size={16} /> Share with friends
                </button>
              )}

              <Link
                to="/bookings"
                onClick={onClose}
                className="w-full h-11 rounded-full flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View my bookings <ChevronRight size={14} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingSuccessScreen;
