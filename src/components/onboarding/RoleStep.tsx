import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Dumbbell, GraduationCap } from "lucide-react";

type OnboardingRole = "user" | "coach";

interface RoleStepProps {
  role: OnboardingRole | null;
  onRoleChange: (role: OnboardingRole) => void;
}

const ROLES = [
  {
    id: "user" as OnboardingRole,
    title: "I want to train",
    description: "Find coaches, book sessions, and track your progress",
    Icon: Dumbbell,
    color: "teal",
  },
  {
    id: "coach" as OnboardingRole,
    title: "I am a coach",
    description: "Build your brand, manage bookings, and grow your audience",
    Icon: GraduationCap,
    color: "orange",
  },
];

export function RoleStep({ role, onRoleChange }: RoleStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          How will you use Circlo?
        </h2>
        <p className="text-gray-600">
          You can always change this later in your profile settings
        </p>
      </div>

      <div className="space-y-4">
        {ROLES.map((r) => (
          <Card
            key={r.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              role === r.id
                ? "border-teal-500 bg-teal-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => onRoleChange(r.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center",
                    role === r.id ? "bg-teal-100" : "bg-gray-100"
                  )}
                >
                  <r.Icon
                    className={cn(
                      "w-7 h-7",
                      role === r.id ? "text-teal-600" : "text-gray-500"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{r.title}</h3>
                  <p className="text-sm text-gray-600">{r.description}</p>
                </div>
                {role === r.id && (
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!role && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Select how you'll use Circlo to continue
        </div>
      )}
    </div>
  );
}
