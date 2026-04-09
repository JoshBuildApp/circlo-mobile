import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 6; // 6:00 - 20:00
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return { value: `${h.toString().padStart(2, "0")}:00`, label: `${display}:00 ${ampm}` };
});

export interface DaySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_participants: number;
}

const BUFFER_OPTIONS = [
  { value: 0, label: "None" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

interface AvailabilitySetupProps {
  slots: DaySlot[];
  onChange: (slots: DaySlot[]) => void;
  bufferMinutes?: number;
  onBufferChange?: (minutes: number) => void;
}

export function AvailabilitySetup({ slots, onChange, bufferMinutes = 0, onBufferChange }: AvailabilitySetupProps) {
  const addSlot = (day: number) => {
    onChange([...slots, { day_of_week: day, start_time: "09:00", end_time: "12:00", max_participants: 1 }]);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, partial: Partial<DaySlot>) => {
    onChange(slots.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  };

  const activeDays = new Set(slots.map((s) => s.day_of_week));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Set your availability</h2>
        <p className="text-sm text-muted-foreground">
          Choose the days and times when trainees can book you.
        </p>
      </div>

      {/* Day toggles */}
      <div>
        <Label className="text-sm text-foreground mb-2 block">Active days</Label>
        <div className="flex gap-1.5">
          {DAYS.map((day, i) => {
            const isActive = activeDays.has(i);
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  if (isActive) {
                    onChange(slots.filter((s) => s.day_of_week !== i));
                  } else {
                    addSlot(i);
                  }
                }}
                className={`flex-1 h-11 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Buffer time between sessions */}
      {onBufferChange && (
        <div>
          <Label className="text-sm text-foreground mb-2 block">Buffer between sessions</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Add a gap between consecutive bookings for rest or travel.
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <select
              value={bufferMinutes}
              onChange={(e) => onBufferChange(Number(e.target.value))}
              className="flex-1 h-10 rounded-lg bg-secondary border-border/50 text-sm px-3 text-foreground"
            >
              {BUFFER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Slot details per active day */}
      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {DAYS.map((day, dayIndex) => {
          const daySlots = slots
            .map((s, originalIndex) => ({ ...s, originalIndex }))
            .filter((s) => s.day_of_week === dayIndex);

          if (daySlots.length === 0) return null;

          return (
            <div key={day} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{day}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addSlot(dayIndex)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add slot
                </button>
              </div>

              {daySlots.map((slot) => (
                <div key={slot.originalIndex} className="flex items-center gap-2">
                  <select
                    value={slot.start_time}
                    onChange={(e) => updateSlot(slot.originalIndex, { start_time: e.target.value })}
                    className="flex-1 h-10 rounded-lg bg-secondary border-border/50 text-sm px-2 text-foreground"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">to</span>
                  <select
                    value={slot.end_time}
                    onChange={(e) => updateSlot(slot.originalIndex, { end_time: e.target.value })}
                    className="flex-1 h-10 rounded-lg bg-secondary border-border/50 text-sm px-2 text-foreground"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                  <select
                    value={slot.max_participants}
                    onChange={(e) => updateSlot(slot.originalIndex, { max_participants: Number(e.target.value) })}
                    className="w-16 h-10 rounded-lg bg-secondary border-border/50 text-sm px-2 text-foreground"
                    title="Max participants"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n}p</option>
                    ))}
                  </select>
                  {daySlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.originalIndex)}
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {activeDays.size === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Tap the days above to set your weekly schedule.
        </div>
      )}
    </div>
  );
}
