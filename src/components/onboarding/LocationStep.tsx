import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface LocationStepProps {
  location: string;
  onLocationChange: (location: string) => void;
}

export function LocationStep({ location, onLocationChange }: LocationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Where are you based?
        </h2>
        <p className="text-gray-600">
          This helps us find coaches and training sessions near you
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        <Label htmlFor="location">City or area</Label>
        <Input
          id="location"
          placeholder="e.g. Tel Aviv, New York, London"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="text-center text-lg h-12"
        />
      </div>

      {!location && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Enter your city or area to continue
        </div>
      )}
    </div>
  );
}
