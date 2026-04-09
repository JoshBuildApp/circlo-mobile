import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  current_participants: number;
  price: number;
  coach: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface LiveSessionBookingModalProps {
  session: LiveSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingComplete: () => void;
}

export function LiveSessionBookingModal({
  session,
  open,
  onOpenChange,
  onBookingComplete
}: LiveSessionBookingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const sessionDate = new Date(session.date + 'T' + session.start_time);

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please log in to book a session");
      return;
    }

    setLoading(true);
    try {
      // Create booking record
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          coach_id: session.coach?.id || "",
          coach_name: session.coach?.full_name || "Coach",
          training_type: "group",
          session_id: session.id,
          date: session.date,
          time: session.start_time,
          time_label: session.start_time,
          status: "confirmed",
          price: session.price || 0,
          payment_method: "bit",
        });

      if (bookingError) throw bookingError;

      toast.success("Session booked successfully!");
      onBookingComplete();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to book session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Live Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={session.coach.avatar_url} />
              <AvatarFallback>{session.coach.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{session.title}</h3>
              <p className="text-sm text-muted-foreground">{session.coach.full_name}</p>
            </div>
          </div>

          {session.description && (
            <p className="text-sm text-muted-foreground">{session.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Date</span>
              </div>
              <span>{format(sessionDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Time</span>
              </div>
              <span>{format(sessionDate, 'h:mm a')}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Participants</span>
              </div>
              <span>{session.current_participants}/{session.max_participants}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Price</span>
              </div>
              <Badge variant="secondary">${session.price}</Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Total Amount</span>
              <span className="text-lg font-semibold">${session.price}</span>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Booking..." : "Book Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}