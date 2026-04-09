import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Calendar, Clock, ChevronRight, Search, CheckCircle2, XCircle, AlertTriangle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Booking {
  id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time_label: string;
  status: string;
  price: number;
  booking_code?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  confirmed: { label: "Confirmed", color: "text-green-500", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-yellow-500", icon: Clock },
  upcoming: { label: "Upcoming", color: "text-blue-500", icon: Clock },
  pending_payment: { label: "Payment Pending", color: "text-orange-500", icon: CreditCard },
  completed: { label: "Completed", color: "text-muted-foreground", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-400", icon: XCircle },
  no_show: { label: "No Show", color: "text-red-400", icon: AlertTriangle },
};

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load bookings:", error);
          toast.error("Failed to load bookings");
        }
        setBookings((data || []) as Booking[]);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="text-base font-bold text-foreground">Your Bookings</p>
          <p className="text-sm text-muted-foreground mt-1">Log in to see your upcoming sessions</p>
        </div>
        <Link to="/login" className="h-12 px-8 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-semibold active:scale-95 transition-transform">
          Log In
        </Link>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => ["confirmed", "pending", "upcoming", "pending_payment"].includes(b.status));
  const past = bookings.filter((b) => ["completed", "cancelled", "no_show"].includes(b.status));

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-foreground">Bookings</h1>
      </div>

      {/* Quick book */}
      <div className="px-4 pb-4">
        <Link
          to="/discover"
          className="flex items-center gap-3 h-12 px-4 rounded-2xl bg-secondary active:bg-muted transition-colors w-full"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Find a coach to book...</span>
        </Link>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex items-center justify-center px-6 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center gap-4 p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-lg max-w-sm w-full"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-foreground">No bookings yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Find a coach and book your first training session to get started.
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-95 transition-all"
            >
              Book a Session
            </Link>
          </motion.div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="px-4 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</p>
              <div className="space-y-2">
                {upcoming.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <Link
                      key={b.id}
                      to={`/coach/${b.coach_id}`}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border active:bg-secondary transition-colors"
                    >
                      <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <StatusIcon className={cn("h-5 w-5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{b.coach_name}</p>
                          <span className={cn("text-[10px] font-semibold", cfg.color)}>{cfg.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.date} · {b.time_label}</p>
                        {b.booking_code && (
                          <p className="text-[10px] font-mono font-bold text-primary mt-0.5">
                            {b.booking_code}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-semibold text-foreground">₪{b.price}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="px-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past</p>
              <div className="space-y-2">
                {past.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.completed;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border opacity-60"
                    >
                      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <StatusIcon className={cn("h-5 w-5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{b.coach_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.date} · {b.time_label}</p>
                      </div>
                      <span className={cn("text-[10px] font-semibold", cfg.color)}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default Bookings;
