import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Check, Zap, AlertCircle, Users, User } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSessionsForDate, type TrainingSession } from "@/hooks/use-training-sessions";
import {
  useAvailability,
  useBlockedSlots,
  useBookedSlots,
  getSlotsForDateFromAvailability,
  isDateAvailableFromSlots,
  getNextAvailableFromSlots,
} from "@/hooks/use-availability";

interface BookingCalendarProps {
  coachId: string;
  coachProfileId?: string;
  onSlotSelect: (date: Date, time: string, label: string, session?: TrainingSession) => void;
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  personal: User,
  small_group: Users,
  group: Users,
};

const BookingCalendar = ({ coachId, coachProfileId, onSlotSelect, selectedDate, selectedTime }: BookingCalendarProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [resolvedProfileId, setResolvedProfileId] = useState<string | undefined>(coachProfileId);

  useEffect(() => {
    if (coachProfileId) {
      setResolvedProfileId(coachProfileId);
      return;
    }
    const lookup = async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id")
        .eq("id", coachId)
        .maybeSingle();
      if (data) setResolvedProfileId(data.id);
    };
    lookup();
  }, [coachId, coachProfileId]);

  const { slots: availabilitySlots } = useAvailability(resolvedProfileId);
  const { blocked } = useBlockedSlots(resolvedProfileId);
  const { bookedMap } = useBookedSlots(coachId);

  const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
  const bookedForDate = dateStr ? (bookedMap[dateStr] || []) : [];

  // Training sessions for selected date
  const { sessions: trainingSessions } = useSessionsForDate(resolvedProfileId, dateStr || undefined);

  const { slots, bookedSlots } = useMemo(() => {
    if (!selectedDate) return { slots: [], bookedSlots: [] };
    return getSlotsForDateFromAvailability(availabilitySlots, selectedDate, bookedForDate, blocked);
  }, [availabilitySlots, selectedDate, bookedForDate, blocked]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSlotSelect(date, "", "");
      setCalendarOpen(false);
    }
  };

  const handleTimeSelect = (time: string, label: string) => {
    if (selectedDate) {
      onSlotSelect(selectedDate, time, label);
    }
  };

  const handleNextAvailable = () => {
    const next = getNextAvailableFromSlots(availabilitySlots, bookedMap, blocked);
    if (next) {
      onSlotSelect(next.date, next.time, next.label);
    }
  };

  const hasAvailability = availabilitySlots.some((s) => s.is_active);
  const availableCount = slots.filter((s) => !bookedSlots.includes(s.time)).length;

  return (
    <div className="space-y-4">
      {!hasAvailability && (
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">This coach hasn't set availability yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon or try a similar coach.</p>
        </div>
      )}

      {hasAvailability && (
        <>
          {/* Quick Book - Next Available */}
          <button
            type="button"
            onClick={handleNextAvailable}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-brand-gradient text-white shadow-brand-sm hover:brightness-110 transition-all active:scale-[0.98] group"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-heading font-bold">Quick Book — Next Available</p>
              <p className="text-[11px] text-white/70">Auto-select the closest open slot</p>
            </div>
          </button>

          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Or pick a date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 rounded-xl bg-secondary border-border/50 hover:bg-secondary/80",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border/50 rounded-xl" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => !isDateAvailableFromSlots(availabilitySlots, date)}
                  className={cn("p-3 pointer-events-auto")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="animate-fade-in">
              {/* Training Sessions */}
              {trainingSessions.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mb-2">
                    Training Sessions
                  </p>
                  <div className="space-y-2">
                    {trainingSessions.map((ts) => {
                      const Icon = TYPE_ICONS[ts.session_type] || User;
                      const spotsLeft = ts.max_capacity - ts.current_bookings;
                      const isFull = ts.status === "full" || spotsLeft <= 0;
                      const isSelected = selectedTime === `session-${ts.id}`;
                      return (
                        <button
                          key={ts.id}
                          disabled={isFull}
                          onClick={() => {
                            if (selectedDate) {
                              onSlotSelect(selectedDate, `session-${ts.id}`, ts.time_label || ts.time, ts);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            isFull
                              ? "bg-secondary/30 border-border/10 opacity-50 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/10 border-primary/30 shadow-sm"
                                : "bg-card border-border/20 hover:border-primary/20 active:scale-[0.98]"
                          )}
                        >
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{ts.title || "Training Session"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{ts.time_label || ts.time}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {ts.session_type === "personal" ? "1-on-1" : ts.session_type === "small_group" ? "Small Group" : "Group"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {ts.price != null && (
                              <p className="text-xs font-bold text-primary">₪{ts.price}</p>
                            )}
                            {isFull ? (
                              <p className="text-[9px] font-bold text-destructive">Full</p>
                            ) : (
                              <p className="text-[9px] text-muted-foreground">
                                {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                              </p>
                            )}
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular time slots header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {trainingSessions.length > 0 ? "Open Slots" : format(selectedDate, "MMM d")}
                  </label>
                </div>
                {availableCount > 0 && availableCount <= 3 && (
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
                    Only {availableCount} left
                  </span>
                )}
                {availableCount > 3 && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {availableCount} available
                  </span>
                )}
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-6 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">No slots on this day</p>
                  <button
                    type="button"
                    onClick={handleNextAvailable}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Find next available →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 hide-scrollbar">
                  {slots.map((slot) => {
                    const isBooked = bookedSlots.includes(slot.time);
                    const isSelected = selectedTime === slot.time;

                    return (
                      <button
                        key={slot.time}
                        disabled={isBooked}
                        onClick={() => handleTimeSelect(slot.time, slot.label)}
                        className={cn(
                          "relative h-12 rounded-xl text-xs font-bold transition-all duration-200",
                          isBooked
                            ? "bg-secondary/50 text-muted-foreground/30 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-primary text-primary-foreground shadow-brand-sm scale-[1.03]"
                            : "bg-secondary text-foreground hover:bg-secondary/80 hover:scale-[1.02] active:scale-95 border border-transparent hover:border-primary/20"
                        )}
                      >
                        {slot.label}
                        {isSelected && (
                          <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-primary-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-3 w-3 rounded bg-secondary border border-border/30" />
                  Available
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-3 w-3 rounded bg-primary" />
                  Selected
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-3 w-3 rounded bg-secondary/50" />
                  Booked
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookingCalendar;
