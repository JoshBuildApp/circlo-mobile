import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvailability } from "@/hooks/use-availability";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

interface Props {
  coachId: string;
  onBook?: (slot: { dayOfWeek: number; startTime: string; endTime: string }) => void;
}

const AvailabilityCalendar = ({ coachId, onBook }: Props) => {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { slots, loading } = useAvailability(coachId);

  // Build the 7 days for current week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + weekOffset * 7);
    return d;
  });

  const weekLabel = `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getDate()}`;

  // Map availability slots by day_of_week
  const slotsByDay = slots.reduce<Record<number, typeof slots>>((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/30 bg-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted/30 rounded mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnySlots = slots.length > 0;

  return (
    <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
        <h3 className="font-semibold text-sm text-foreground">Availability</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            disabled={weekOffset <= 0}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!hasAnySlots ? (
        <div className="py-10 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No availability set</p>
          <p className="text-xs text-muted-foreground mt-1">Contact coach directly to book</p>
        </div>
      ) : (
        <div className="p-4">
          {/* Day columns */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dayOfWeek = day.getDay();
              const daySlots = slotsByDay[dayOfWeek] || [];
              const isPast = day < new Date(today.setHours(0,0,0,0));
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div key={i} className="flex flex-col gap-1.5">
                  {/* Day header */}
                  <div className={cn(
                    "text-center pb-2",
                    isToday && "text-primary"
                  )}>
                    <div className="text-[10px] text-muted-foreground">{DAYS[dayOfWeek]}</div>
                    <div className={cn(
                      "text-sm font-semibold mt-0.5",
                      isToday ? "text-primary" : "text-foreground",
                      isPast && "text-muted-foreground"
                    )}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Slots */}
                  {daySlots.length === 0 ? (
                    <div className="h-16 rounded-lg bg-muted/10 flex items-center justify-center">
                      <span className="text-[9px] text-muted-foreground/50">–</span>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const slotKey = `${dayOfWeek}-${slot.start_time}`;
                      const isSelected = selectedSlot === slotKey;
                      return (
                        <button
                          key={slot.id}
                          disabled={isPast}
                          onClick={() => {
                            setSelectedSlot(isSelected ? null : slotKey);
                            if (!isSelected && onBook) {
                              onBook({ dayOfWeek, startTime: slot.start_time, endTime: slot.end_time });
                            }
                          }}
                          className={cn(
                            "w-full rounded-lg p-1.5 text-center transition-all active:scale-95",
                            isPast ? "opacity-40 cursor-not-allowed bg-muted/10" :
                            isSelected ? "bg-primary text-primary-foreground shadow-brand-sm" :
                            "bg-success/10 hover:bg-success/20 border border-success/20"
                          )}
                        >
                          <div className={cn("text-[9px] font-medium leading-tight",
                            isSelected ? "text-primary-foreground" : "text-success"
                          )}>
                            {formatTime(slot.start_time)}
                          </div>
                          <div className={cn("text-[8px] leading-tight mt-0.5",
                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatTime(slot.end_time)}
                          </div>
                          {slot.max_participants && slot.max_participants > 1 && (
                            <div className="flex items-center justify-center gap-0.5 mt-0.5">
                              <Users className="h-2 w-2 text-muted-foreground" />
                              <span className="text-[8px] text-muted-foreground">{slot.max_participants}</span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/20">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-success/30 border border-success/30" />
              <span className="text-[10px] text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-[10px] text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-muted/20" />
              <span className="text-[10px] text-muted-foreground">Unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
