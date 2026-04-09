import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SKILL_LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Just starting out or getting back into sports",
    emoji: "🌱",
    color: "green"
  },
  {
    id: "intermediate",
    name: "Intermediate", 
    description: "Have some experience and looking to improve",
    emoji: "🏃",
    color: "blue"
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Skilled player looking for high-level training",
    emoji: "⭐",
    color: "yellow"
  },
  {
    id: "professional",
    name: "Professional",
    description: "Competing at professional or semi-professional level",
    emoji: "🏆",
    color: "purple"
  }
];

interface SkillLevelSelectionProps {
  skillLevel: string;
  onSkillLevelChange: (level: string) => void;
}

export function SkillLevelSelection({ skillLevel, onSkillLevelChange }: SkillLevelSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          What's your skill level?
        </h2>
        <p className="text-gray-600">
          Help us match you with coaches and training programs at the right level
        </p>
      </div>

      <div className="space-y-3">
        {SKILL_LEVELS.map((level) => (
          <Card
            key={level.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              skillLevel === level.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onSkillLevelChange(level.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{level.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{level.name}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
                {skillLevel === level.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!skillLevel && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Please select your skill level to continue
        </div>
      )}
    </div>
  );
}