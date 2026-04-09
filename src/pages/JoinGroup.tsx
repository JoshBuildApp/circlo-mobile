import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Calendar, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupBooking {
  id: string;
  coach_id: string;
  coach_name: string;
  date: string;
  time_label: string;
  price_per_person: number;
  total_participants: number;
  group_status: string;
  training_type: string;
}

const JoinGroup = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<GroupBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("group_invite_code", code)
        .eq("is_group", true)
        .maybeSingle();

      if (data) {
        setBooking(data as any);

        // Get current participant count
        const { count } = await supabase
          .from("booking_participants")
          .select("*", { count: "exact", head: true })
          .eq("booking_id", data.id);
        setCurrentCount(count || 0);

        // Check if already joined
        if (user) {
          const { data: existing } = await supabase
            .from("booking_participants")
            .select("id")
            .eq("booking_id", data.id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (existing) setAlreadyJoined(true);
        }
      }
      setLoading(false);
    };
    load();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !booking) return;
    setJoining(true);

    // Check capacity
    if (currentCount >= booking.total_participants) {
      toast.error("Session is full - no more spots available");
      setJoining(false);
      return;
    }

    const { error } = await supabase.from("booking_participants").insert({
      booking_id: booking.id,
      user_id: user.id,
      payment_status: "unpaid",
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already in this group");
      } else {
        toast.error(error.message);
      }
    } else {
      setJoined(true);
      toast.success("You've joined the group!");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 gap-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="text-base font-bold text-foreground">Invite Not Found</p>
          <p className="text-sm text-muted-foreground mt-1">This invite link is invalid or has expired</p>
        </div>
        <Link to="/home" className="h-12 px-8 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-semibold">
          Go Home
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <Users className="h-12 w-12 text-primary/30" />
        <div>
          <p className="text-base font-bold text-foreground">Join Group Session</p>
          <p className="text-sm text-muted-foreground mt-1">Log in or sign up to join this group training</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 w-full">
          <p className="text-sm font-bold text-foreground">{booking.coach_name}</p>
          <p className="text-xs text-muted-foreground">{booking.date} · {booking.time_label}</p>
          <p className="text-sm font-bold text-primary mt-1">₪{booking.price_per_person}/person</p>
        </div>
        <Link to="/login" className="h-12 px-8 rounded-xl bg-foreground text-background flex items-center justify-center text-sm font-semibold w-full">
          Log In to Join
        </Link>
        <Link to="/signup" className="text-xs text-primary font-bold">
          Don't have an account? Sign up
        </Link>
      </div>
    );
  }

  const spotsLeft = booking.total_participants - currentCount;
  const isFull = spotsLeft <= 0;

  if (joined || alreadyJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto shadow-brand">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <div>
          <p className="text-xl font-heading font-bold text-foreground">
            {alreadyJoined ? "Already Joined!" : "You're In!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">You've joined the group session</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 w-full">
          <p className="text-sm font-bold text-foreground">{booking.coach_name}</p>
          <p className="text-xs text-muted-foreground">{booking.date} · {booking.time_label}</p>
          <p className="text-sm font-bold text-primary mt-1">₪{booking.price_per_person}/person</p>
        </div>
        <Button onClick={() => navigate("/bookings")} className="w-full rounded-2xl h-12 bg-brand-gradient text-white font-heading font-bold border-0">
          View My Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-4">
      <Users className="h-12 w-12 text-primary" />
      <div className="text-center">
        <p className="text-xl font-heading font-bold text-foreground">Join Group Session</p>
        <p className="text-sm text-muted-foreground mt-1">You've been invited to train together!</p>
      </div>

      <div className="bg-card border border-border/20 rounded-2xl p-5 w-full space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{booking.coach_name}</p>
            <p className="text-[11px] text-muted-foreground">Coach</p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {booking.date}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {booking.time_label}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div>
            <p className="text-xs text-muted-foreground">Price per person</p>
            <p className="text-lg font-heading font-bold text-primary">₪{booking.price_per_person}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Spots left</p>
            <p className={`text-lg font-heading font-bold ${isFull ? "text-destructive" : "text-foreground"}`}>
              {isFull ? "Full" : spotsLeft}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleJoin}
        disabled={joining || isFull}
        className="w-full rounded-2xl h-14 text-sm font-heading font-bold bg-brand-gradient border-0 hover:brightness-110 active:scale-[0.98] shadow-brand-sm text-white"
      >
        {joining ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isFull ? (
          "Session Full"
        ) : (
          "Join Group Session"
        )}
      </Button>
    </div>
  );
};

export default JoinGroup;
