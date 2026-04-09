import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Sparkles } from "lucide-react";
import { useCoachRecommendations } from "@/hooks/use-coach-recommendations";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function RecommendedCoaches() {
  const { recommendedCoaches, loading } = useCoachRecommendations();
  const navigate = useNavigate();

  if (loading) return <RecommendedCoachesSkeleton />;
  if (recommendedCoaches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Recommended for You</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendedCoaches.map((coach) => (
          <Card key={coach.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={coach.avatar_url || ""} />
                  <AvatarFallback>{coach.coach_name?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{coach.coach_name}</h3>
                  {coach.rating > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{coach.rating.toFixed(1)}</span>
                      <span>({coach.reviews_count})</span>
                    </div>
                  )}
                  {coach.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{coach.location}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  {coach.price && (
                    <div className="text-sm font-medium">₪{coach.price}/hr</div>
                  )}
                </div>
              </div>
              
              {coach.sport && (
                <div className="flex flex-wrap gap-1 mt-3">
                  <Badge variant="secondary" className="text-xs">{coach.sport}</Badge>
                </div>
              )}
              
              {coach.recommendation_reasons.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Why recommended:</div>
                  <div className="text-xs text-primary bg-primary/10 rounded px-2 py-1">
                    {coach.recommendation_reasons[0]}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/coach/${coach.id}`)}>
                  View Profile
                </Button>
                <Button size="sm" className="flex-1" onClick={() => navigate(`/coach/${coach.id}`)}>
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RecommendedCoachesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Recommended for You</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
