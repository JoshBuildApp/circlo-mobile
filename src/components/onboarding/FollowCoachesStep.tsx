import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Check } from "lucide-react";

interface Coach {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
  tagline: string | null;
  is_verified: boolean;
}

interface FollowCoachesStepProps {
  selectedCoachIds: string[];
  onSelectionChange: (ids: string[]) => void;
  interests: string[];
}

export function FollowCoachesStep({
  selectedCoachIds,
  onSelectionChange,
  interests,
}: FollowCoachesStepProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);

      let query = supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, image_url, rating, tagline, is_verified")
        .eq("is_fake", false)
        .order("rating", { ascending: false })
        .limit(12);

      // If user picked interests, prefer coaches in those sports
      if (interests.length > 0) {
        query = query.in("sport", interests);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching coaches:", error);
        // Fall back to all coaches if filtered query returns nothing
        const { data: fallback } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, sport, image_url, rating, tagline, is_verified")
          .eq("is_fake", false)
          .order("rating", { ascending: false })
          .limit(12);
        setCoaches(fallback || []);
      } else if (data && data.length === 0 && interests.length > 0) {
        // No coaches for selected sports — fetch all
        const { data: allCoaches } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, sport, image_url, rating, tagline, is_verified")
          .eq("is_fake", false)
          .order("rating", { ascending: false })
          .limit(12);
        setCoaches(allCoaches || []);
      } else {
        setCoaches(data || []);
      }

      setLoading(false);
    };

    fetchCoaches();
  }, [interests]);

  const toggleCoach = (coachId: string) => {
    const newSelection = selectedCoachIds.includes(coachId)
      ? selectedCoachIds.filter((id) => id !== coachId)
      : [...selectedCoachIds, coachId];
    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-600">Finding the best coaches for you...</p>
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-600">No coaches available yet. You can skip this step.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Follow at least 3 coaches
        </h2>
        <p className="text-gray-600">
          Get training content and updates from coaches you follow
        </p>
        <div className="mt-3">
          <Badge
            variant={selectedCoachIds.length >= 3 ? "default" : "secondary"}
            className={cn(
              "text-sm px-3 py-1",
              selectedCoachIds.length >= 3 && "bg-teal-500"
            )}
          >
            {selectedCoachIds.length} / 3 selected
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {coaches.map((coach) => {
          const isSelected = selectedCoachIds.includes(coach.id);
          return (
            <Card
              key={coach.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                isSelected
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => toggleCoach(coach.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={coach.image_url || undefined} alt={coach.coach_name} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold">
                      {coach.coach_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {coach.coach_name}
                      </h3>
                      {coach.is_verified && (
                        <span className="text-teal-500 text-xs" title="Verified">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {coach.sport}
                      {coach.rating ? ` · ⭐ ${coach.rating.toFixed(1)}` : ""}
                    </p>
                    {coach.tagline && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {coach.tagline}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "shrink-0",
                      isSelected && "bg-teal-500 hover:bg-teal-600"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCoach(coach.id);
                    }}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCoachIds.length < 3 && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Select at least {3 - selectedCoachIds.length} more coach{selectedCoachIds.length === 2 ? "" : "es"} to continue
        </div>
      )}
    </div>
  );
}
