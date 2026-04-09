import { useState, useEffect } from "react";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import { CreateLiveSessionModal } from "@/components/CreateLiveSessionModal";
import { LiveSessionBookingModal } from "@/components/LiveSessionBookingModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  price: number;
  session_link?: string;
  coach: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  current_participants: number;
  is_booked?: boolean;
  is_full: boolean;
}

export default function LiveSessions() {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [mySessions, setMySessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bookingSession, setBookingSession] = useState<LiveSession | null>(null);

  const isCoach = role === 'coach' || role === 'developer';

  useEffect(() => {
    loadSessions();
    if (user) loadMySessions();
  }, [user]);

  const loadSessions = async () => {
    try {
      // Use training_sessions table which actually exists
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .eq("is_public", true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const mapped: LiveSession[] = (data || []).map((s: any) => ({
        id: s.id,
        title: s.title || "Training Session",
        description: s.description || "",
        date: s.date,
        start_time: s.time || "09:00",
        end_time: s.time || "10:00",
        max_participants: s.max_capacity || 1,
        price: s.price || 0,
        coach: { id: s.coach_id, full_name: "Coach", avatar_url: undefined },
        current_participants: s.current_bookings || 0,
        is_booked: false,
        is_full: (s.current_bookings || 0) >= (s.max_capacity || 1),
      }));

      setSessions(mapped);
    } catch (error: any) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadMySessions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const mapped: LiveSession[] = (data || []).map((b: any) => ({
        id: b.id,
        title: b.training_type || "Session",
        description: "",
        date: b.date,
        start_time: b.time || "09:00",
        end_time: b.time || "10:00",
        max_participants: 1,
        price: b.price || 0,
        coach: { id: b.coach_id, full_name: b.coach_name, avatar_url: undefined },
        current_participants: 1,
        is_booked: true,
        is_full: false,
      }));

      setMySessions(mapped);
    } catch (error: any) {
      toast.error("Failed to load your sessions");
    }
  };

  const handleBookSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) setBookingSession(session);
  };

  const handleJoinSession = (sessionLink: string) => {
    window.open(sessionLink, '_blank');
  };

  const getSessionsToShow = (sessionsList: LiveSession[]) => {
    if (!searchQuery) return sessionsList;
    return sessionsList.filter(session =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.coach.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const shouldShowJoinButton = (session: LiveSession) => {
    const sessionDate = new Date(session.date + 'T' + session.start_time);
    const now = new Date();
    const minutesUntilStart = (sessionDate.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilStart <= 15 && minutesUntilStart >= -30;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Sessions</h1>
        {isCoach && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          {user && <TabsTrigger value="my">My Sessions</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {getSessionsToShow(sessions).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No live sessions found</p>
            </div>
          ) : (
            getSessionsToShow(sessions).map((session) => (
              <LiveSessionCard
                key={session.id}
                session={session}
                onBook={handleBookSession}
                onJoin={handleJoinSession}
                showJoinButton={shouldShowJoinButton(session)}
              />
            ))
          )}
        </TabsContent>

        {user && (
          <TabsContent value="my" className="space-y-4 mt-6">
            {getSessionsToShow(mySessions).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isCoach ? "You haven't created any sessions yet" : "You haven't booked any sessions yet"}
                </p>
              </div>
            ) : (
              getSessionsToShow(mySessions).map((session) => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  onJoin={handleJoinSession}
                  showJoinButton={shouldShowJoinButton(session)}
                />
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      <CreateLiveSessionModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSessionCreated={() => {
          loadSessions();
          loadMySessions();
        }}
      />

      <LiveSessionBookingModal
        session={bookingSession}
        open={!!bookingSession}
        onOpenChange={() => setBookingSession(null)}
        onBookingComplete={() => {
          loadSessions();
          loadMySessions();
        }}
      />
    </div>
  );
}
