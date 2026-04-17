import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Clock, User, CheckCircle2, XCircle, ChevronDown, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  user_id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time: string;
  time_label: string;
  status: string;
  price: number;
  created_at: string;
  booking_code?: string;
  payment_method?: string;
  is_group?: boolean;
  total_participants?: number;
  group_status?: string;
  training_type?: string;
  price_per_person?: number;
  group_invite_code?: string;
  user_name?: string;
  participants?: { user_id: string; payment_status: string; username?: string }[];
}

interface CoachSessionsProps {
  coachProfileId: string;
}

const CoachSessions = ({ coachProfileId }: CoachSessionsProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("coach_id", coachProfileId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (data) {
      // Fetch user profiles for names
      const userIds = [...new Set(data.map((b: any) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap: Record<string, string> = {};
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.user_id] = p.username;
        }
      }

      const enriched = data.map((b: any) => ({
        ...b,
        user_name: profileMap[b.user_id] || "Unknown",
      }));

      // Fetch participants for group bookings
      const groupIds = enriched.filter((b: any) => b.is_group).map((b: any) => b.id);
      if (groupIds.length > 0) {
        const { data: allParticipants } = await supabase
          .from("booking_participants")
          .select("*")
          .in("booking_id", groupIds);

        if (allParticipants) {
          const pUserIds = [...new Set(allParticipants.map((p: any) => p.user_id))];
          const { data: pProfiles } = await supabase
            .from("profiles")
            .select("user_id, username")
            .in("user_id", pUserIds);
          const pMap: Record<string, string> = {};
          if (pProfiles) for (const p of pProfiles) pMap[p.user_id] = p.username;

          for (const b of enriched) {
            if (b.is_group) {
              b.participants = allParticipants
                .filter((p: any) => p.booking_id === b.id)
                .map((p: any) => ({ ...p, username: pMap[p.user_id] || "Unknown" }));
            }
          }
        }
      }

      setBookings(enriched);
    }
    setLoading(false);
  }, [coachProfileId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(
    (b) => b.date >= today && !["cancelled"].includes(b.status)
  );
  const past = bookings.filter(
    (b) => b.date < today || b.status === "cancelled"
  );

  const displayed = tab === "upcoming" ? upcoming : past;

  const handleConfirm = async (id: string) => {
    const booking = bookings.find(b => b.id === id);
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);

    // Award XP to the trainee on confirmation
    if (booking?.user_id) {
      const xp = booking.training_type === 'group' ? 70 : 100;
      supabase.rpc("award_training_xp", { _user_id: booking.user_id, _xp_amount: xp }).then(() => {});
      // Also award XP to group participants
      if (booking.is_group && booking.participants) {
        for (const p of booking.participants) {
          if (p.user_id !== booking.user_id) {
            supabase.rpc("award_training_xp", { _user_id: p.user_id, _xp_amount: xp }).then(() => {});
          }
        }
      }
    }

    toast.success("Booking confirmed");
    fetchBookings();
  };

  const handleCancel = async (id: string) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    toast.success("Booking cancelled");
    fetchBookings();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "confirmed": return "bg-accent/15 text-accent border-accent/20";
      case "pending":
      case "upcoming": return "bg-primary/10 text-primary border-primary/20";
      case "pending_payment": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-secondary text-muted-foreground border-border/30";
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <CalendarDays className="h-[18px] w-[18px] text-accent" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">My Sessions</h2>
            <p className="text-[11px] text-muted-foreground">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        <button
          onClick={() => setTab("upcoming")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all",
            tab === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all",
            tab === "past"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Past ({past.length})
        </button>
      </div>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-heading font-bold text-foreground mb-1">
            {tab === "upcoming" ? "No upcoming sessions" : "No past sessions"}
          </p>
          <p className="text-xs text-muted-foreground">
            {tab === "upcoming"
              ? "When trainees book sessions, they'll appear here."
              : "Completed sessions will show up here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-xl border border-border/50 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  {booking.is_group ? (
                    <Users className="h-[18px] w-[18px] text-accent" />
                  ) : (
                    <User className="h-[18px] w-[18px] text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-foreground truncate">
                    {booking.is_group ? `Group (${booking.participants?.length || 1}/${booking.total_participants})` : booking.user_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(booking.date)}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs text-muted-foreground">
                      {booking.time_label}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs font-medium text-foreground">
                      ₪{booking.price}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(booking as any).payment_method === "arrival" && (
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                      Pay at session
                    </span>
                  )}
                  {(booking as any).payment_method === "bit" && (
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-[#1DBF73]/10 text-[#1DBF73] border border-[#1DBF73]/20">
                      Bit
                    </span>
                  )}
                  <span className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-lg border capitalize",
                    statusColor(booking.status)
                  )}>
                    {booking.status === "pending_payment" ? "Awaiting Pay" : booking.status}
                  </span>
                </div>
              </div>

              {/* Booking code row */}
              {(booking as any).booking_code && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Code:</span>
                    <span className="text-sm font-heading font-black tracking-wider text-foreground">
                      {(booking as any).booking_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tab === "upcoming" && booking.status !== "confirmed" && booking.status !== "cancelled" && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(booking.id)}
                        className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-accent/15 text-accent hover:bg-accent/25 border-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Confirm
                      </Button>
                    )}
                    {tab === "upcoming" && booking.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(booking.id)}
                        className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Cancel"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Group participants */}
              {booking.is_group && booking.participants && booking.participants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Participants ({booking.participants.length}/{booking.total_participants})
                  </p>
                  <div className="space-y-1.5">
                    {booking.participants.map((p) => (
                      <div key={p.user_id} className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{p.username}</span>
                        <span className={cn(
                          "text-[9px] font-medium px-2 py-0.5 rounded-md border",
                          p.payment_status === "paid"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-destructive/5 text-destructive border-destructive/20"
                        )}>
                          {p.payment_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback actions if no booking code */}
              {!(booking as any).booking_code && tab === "upcoming" && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-end gap-1.5">
                  {booking.status !== "confirmed" && booking.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleConfirm(booking.id)}
                      className="h-8 w-8 p-0 rounded-lg text-accent hover:bg-accent/10"
                      title="Confirm"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  {booking.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(booking.id)}
                      className="h-8 w-8 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                      title="Cancel"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachSessions;
