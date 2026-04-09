import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  { id: "early_morning", name: "Early Morning", time: "6:00 - 9:00 AM", emoji: "🌅" },
  { id: "morning", name: "Morning", time: "9:00 AM - 12:00 PM", emoji: "☀️" },
  { id: "afternoon", name: "Afternoon", time: "12:00 - 5:00 PM", emoji: "🌤️" },
  { id: "evening", name: "Evening", time: "5:00 - 8:00 PM", emoji: "🌆" },
  { id: "night", name: "Night", time: "8:00 - 11:00 PM", emoji: "🌙" }
];

const TIME_ZONES = [
  { value: "UTC-8", label: "Pacific Time (PT)" },
  { value: "UTC-7", label: "Mountain Time (MT)" },
  { value: "UTC-6", label: "Central Time (CT)" },
  { value: "UTC-5", label: "Eastern Time (ET)" },
  { value: "UTC+0", label: "UTC" },
  { value: "UTC+1", label: "Central European Time (CET)" },
  { value: "UTC+2", label: "Eastern European Time (EET)" },
  { value: "UTC+8", label: "China Standard Time (CST)" },
  { value: "UTC+9", label: "Japan Standard Time (JST)" }
];

interface TimePreferenceSelectionProps {
  timePreferences: {
    preferred_times: string[];
    time_zone: string;
  };
  onTimePreferencesChange: (preferences: {
    preferred_times: string[];
    time_zone: string;
  }) => void;
}

export function TimePreferenceSelection({ 
  timePreferences, 
  onTimePreferencesChange 
}: TimePreferenceSelectionProps) {
  const [detectedTimeZone, setDetectedTimeZone] = useState<string>("");

  useEffect(() => {
    // Auto-detect user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset() / -60;
    const offsetString = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
    
    setDetectedTimeZone(offsetString);
    
    // Set default timezone if not already set
    if (!timePreferences.time_zone) {
      onTimePreferencesChange({
        ...timePreferences,
        time_zone: offsetString
      });
    }
  }, []);

  const handleTimeSlotToggle = (slotId: string) => {
    const newTimes = timePreferences.preferred_times.includes(slotId)
      ? timePreferences.preferred_times.filter(id => id !== slotId)
      : [...timePreferences.preferred_times, slotId];
    
    onTimePreferencesChange({
      ...timePreferences,
      preferred_times: newTimes
    });
  };

  const handleTimeZoneChange = (timezone: string) => {
    onTimePreferencesChange({
      ...timePreferences,
      time_zone: timezone
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          When do you prefer to train?
        </h2>
        <p className="text-gray-600">
          Select your preferred training times to get matched with coaches in your schedule
        </p>
      </div>

      {/* Time Zone Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Your Time Zone
        </label>
        <Select value={timePreferences.time_zone} onValueChange={handleTimeZoneChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your time zone" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
                {tz.value === detectedTimeZone && " (Detected)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Preferred Training Times
        </label>
        <div className="grid gap-3">
          {TIME_SLOTS.map((slot) => (
            <Card
              key={slot.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                timePreferences.preferred_times.includes(slot.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleTimeSlotToggle(slot.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{slot.emoji}</span>
                    <div>
                      <div className="font-medium">{slot.name}</div>
                      <div className="text-sm text-gray-600">{slot.time}</div>
                    </div>
                  </div>
                  {timePreferences.preferred_times.includes(slot.id) && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {timePreferences.preferred_times.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <span className="text-sm font-medium text-gray-700 mr-2">Selected times:</span>
          {timePreferences.preferred_times.map((timeId) => {
            const slot = TIME_SLOTS.find(s => s.id === timeId);
            return slot ? (
              <Badge key={timeId} variant="secondary">
                {slot.emoji} {slot.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {(timePreferences.preferred_times.length === 0 || !timePreferences.time_zone) && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Please select your time zone and at least one preferred training time to continue
        </div>
      )}
    </div>
  );
}