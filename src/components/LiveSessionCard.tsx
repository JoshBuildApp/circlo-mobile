import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Users, DollarSign, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  session_link?: string;
  is_booked?: boolean;
  is_full: boolean;
}

interface LiveSessionCardProps {
  session: LiveSession;
  onBook?: (sessionId: string) => void;
  onJoin?: (sessionLink: string) => void;
  showJoinButton?: boolean;
  className?: string;
}

export function LiveSessionCard({
  session,
  onBook,
  onJoin,
  showJoinButton = false,
  className
}: LiveSessionCardProps) {
  const sessionDate = new Date(session.date + 'T' + session.start_time);
  const endDate = new Date(session.date + 'T' + session.end_time);
  const now = new Date();
  const isUpcoming = sessionDate > now;
  const isLive = now >= sessionDate && now <= endDate;
  const isPast = now > endDate;

  const getStatusBadge = () => {
    if (isPast) return <Badge variant="secondary">Past</Badge>;
    if (isLive) return <Badge className="bg-red-500 hover:bg-red-600">Live</Badge>;
    if (showJoinButton) return <Badge className="bg-green-500 hover:bg-green-600">Starting Soon</Badge>;
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={session.coach.avatar_url} />
              <AvatarFallback>{session.coach.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg line-clamp-1">{session.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{session.coach.full_name}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(sessionDate, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(sessionDate, 'h:mm a')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{session.current_participants}/{session.max_participants}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${session.price}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {showJoinButton && session.session_link && session.is_booked && (
            <Button
              onClick={() => onJoin?.(session.session_link!)}
              className="flex-1"
              variant="default"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Session
            </Button>
          )}
          
          {!session.is_booked && !isPast && !session.is_full && (
            <Button
              onClick={() => onBook?.(session.id)}
              className="flex-1"
              variant="outline"
            >
              Book Now
            </Button>
          )}

          {session.is_full && !session.is_booked && (
            <Button disabled className="flex-1">
              Session Full
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}