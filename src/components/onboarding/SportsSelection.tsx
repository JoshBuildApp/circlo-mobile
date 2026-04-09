import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SPORTS = [
  { id: "football", name: "Football", emoji: "⚽" },
  { id: "basketball", name: "Basketball", emoji: "🏀" },
  { id: "tennis", name: "Tennis", emoji: "🎾" },
  { id: "swimming", name: "Swimming", emoji: "🏊" },
  { id: "running", name: "Running", emoji: "🏃" },
  { id: "cycling", name: "Cycling", emoji: "🚴" },
  { id: "yoga", name: "Yoga", emoji: "🧘" },
  { id: "boxing", name: "Boxing", emoji: "🥊" },
  { id: "golf", name: "Golf", emoji: "⛳" },
  { id: "baseball", name: "Baseball", emoji: "⚾" },
  { id: "volleyball", name: "Volleyball", emoji: "🏐" },
  { id: "skiing", name: "Skiing", emoji: "⛷️" },
  { id: "surfing", name: "Surfing", emoji: "🏄" },
  { id: "climbing", name: "Climbing", emoji: "🧗" },
  { id: "martial_arts", name: "Martial Arts", emoji: "🥋" },
  { id: "hockey", name: "Hockey", emoji: "🏒" }
];

interface SportsSelectionProps {
  selectedSports: string[];
  onSelectionChange: (sports: string[]) => void;
}

export function SportsSelection({ selectedSports, onSelectionChange }: SportsSelectionProps) {
  const handleSportToggle = (sportId: string) => {
    const newSelection = selectedSports.includes(sportId)
      ? selectedSports.filter(id => id !== sportId)
      : [...selectedSports, sportId];
    
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          What sports do you love?
        </h2>
        <p className="text-gray-600">
          Select all the sports you're interested in. This helps us recommend the best coaches and content for you.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {SPORTS.map((sport) => (
          <Card
            key={sport.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              selectedSports.includes(sport.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => handleSportToggle(sport.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{sport.emoji}</div>
              <div className="font-medium text-sm">{sport.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSports.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mr-2">Selected:</span>
          {selectedSports.map((sportId) => {
            const sport = SPORTS.find(s => s.id === sportId);
            return sport ? (
              <Badge key={sportId} variant="secondary">
                {sport.emoji} {sport.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {selectedSports.length === 0 && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Please select at least one sport to continue
        </div>
      )}
    </div>
  );
}