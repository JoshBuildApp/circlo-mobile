import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Plus, Trash2, Clock, CalendarDays, ToggleLeft, ToggleRight,
  AlertCircle, Repeat, CalendarCheck, Check, Users, User,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAvailability, formatHour, type AvailabilitySlot, type ScheduleType } from "@/hooks/use-availability";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScheduleManagerProps {
  coachProfileId: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  return { value: `${h.toString().padStart(2, "0")}:00`, label: formatHour(`${h.toString().padStart(2, "0")}:00`) };
});

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
];

const TRAINING_TYPES = [
  { value: "personal", label: "Personal (1:1)", icon: User },
  { value: "group", label: "Group", icon: Users },
];

/* ── Overlap detection ── */
function hasOverlap(
  slots: AvailabilitySlot[],
  scheduleType: ScheduleType,
  dayOfWeek: number,
  specificDate: string | null,
  startTime: string,
  endTime: string,
): boolean {
  return slots.some((s) => {
    if (!s.is_active) return false;
    if (scheduleType === "recurring" && s.schedule_type === "recurring" && s.day_of_week === dayOfWeek) {
      return s.start_time < endTime && s.end_time > startTime;
    }
    if (scheduleType === "specific" && s.schedule_type === "specific" && s.specific_date === specificDate) {
      return s.start_time < endTime && s.end_time > startTime;
    }
    if (scheduleType === "specific" && s.schedule_type === "recurring" && s.day_of_week === dayOfWeek) {
      return s.start_time < endTime && s.end_time > startTime;
    }
    if (scheduleType === "recurring" && s.schedule_type === "specific") {
      const d = new Date(s.specific_date + "T00:00:00");
      if (d.getDay() === dayOfWeek) {
        return s.start_time < endTime && s.end_time > startTime;
      }
    }
    return false;
  });
}

const ScheduleManager = ({ coachProfileId }: ScheduleManagerProps) => {
  const { slots, loading, refresh } = useAvailability(coachProfileId);

  // Form state
  const [adding, setAdding] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("recurring");

  // Allowed types
  const [allowedTypes, setAllowedTypes] = useState<string[]>(["personal", "group"]);
  const [maxParticipants, setMaxParticipants] = useState("1");
  const [autoApprove, setAutoApprove] = useState(false);

  // Recurring
  const [selectedDays, setSelectedDays] = useState<number[]>([1]);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // Specific
  const [specificDate, setSpecificDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setAdding(false);
    setScheduleType("recurring");
    setAllowedTypes(["personal", "group"]);
    setMaxParticipants("1");
    setAutoApprove(false);
    setSelectedDays([1]);
    setNewStart("09:00");
    setNewEnd("17:00");
    setSpecificDate(undefined);
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleType = (type: string) => {
    setAllowedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev; // must have at least one
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleAdd = async () => {
    if (allowedTypes.length === 0) {
      toast.error("Select at least one training type");
      return;
    }
    if (newStart >= newEnd) {
      toast.error("End time must be after start time");
      return;
    }
    if (scheduleType === "specific" && !specificDate) {
      toast.error("Please select a date");
      return;
    }
    if (scheduleType === "recurring" && selectedDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    const rows: any[] = [];
    if (scheduleType === "recurring") {
      for (const day of selectedDays) {
        if (hasOverlap(slots, "recurring", day, null, newStart, newEnd)) {
          const dayLabel = DAYS.find((d) => d.value === day)?.label || "";
          toast.error(`Overlap on ${dayLabel}`);
          return;
        }
        rows.push({
          coach_id: coachProfileId,
          day_of_week: day,
          start_time: newStart,
          end_time: newEnd,
          is_active: true,
          schedule_type: "recurring",
          specific_date: null,
          allowed_training_types: allowedTypes,
          auto_approve: autoApprove,
          max_participants: parseInt(maxParticipants) || 1,
        });
      }
    } else {
      const dateStr = specificDate!.toISOString().split("T")[0];
      const dayOfWeek = specificDate!.getDay();
      if (hasOverlap(slots, "specific", dayOfWeek, dateStr, newStart, newEnd)) {
        toast.error("Time overlap");
        return;
      }
      rows.push({
        coach_id: coachProfileId,
        day_of_week: dayOfWeek,
        start_time: newStart,
        end_time: newEnd,
        is_active: true,
        schedule_type: "specific",
        specific_date: dateStr,
        allowed_training_types: allowedTypes,
        auto_approve: autoApprove,
        max_participants: parseInt(maxParticipants) || 1,
      });
    }

    setSaving(true);
    const { error } = await supabase.from("availability").insert(rows);
    setSaving(false);
    if (error) {
      toast.error("Failed to add slot");
    } else {
      const count = rows.length;
      toast.success(`${count} slot${count > 1 ? "s" : ""} added`);
      resetForm();
      refresh();
    }
  };

  const handleDelete = async (slot: AvailabilitySlot) => {
    await supabase.from("availability").delete().eq("id", slot.id);
    toast.success("Slot removed");
    refresh();
  };

  const handleToggle = async (slot: AvailabilitySlot) => {
    await supabase.from("availability").update({ is_active: !slot.is_active }).eq("id", slot.id);
    toast.success(slot.is_active ? "Slot deactivated" : "Slot activated");
    refresh();
  };

  /* ── Grouped views ── */
  const recurringSlots = useMemo(
    () => slots.filter((s) => s.schedule_type !== "specific"),
    [slots]
  );
  const specificSlots = useMemo(
    () => slots.filter((s) => s.schedule_type === "specific").sort((a, b) => (a.specific_date || "").localeCompare(b.specific_date || "")),
    [slots]
  );

  const allDays = DAYS.map((day) => ({
    ...day,
    slots: recurringSlots.filter((s) => s.day_of_week === day.value),
  }));

  const specificByDate = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    for (const s of specificSlots) {
      const d = s.specific_date || "unknown";
      if (!map[d]) map[d] = [];
      map[d].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [specificSlots]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">My Schedule</h2>
            <p className="text-[11px] text-muted-foreground">Recurring &amp; one-time availability</p>
          </div>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5 rounded-xl h-9">
            <Plus className="h-3.5 w-3.5" />
            Add Slot
          </Button>
        )}
      </div>

      {/* ── Add Form ── */}
      {adding && (
        <div className="bg-secondary/50 rounded-2xl border border-border/50 p-5 space-y-4 animate-fade-in">
          {/* Step 1 — Schedule type */}
          <div>
            <p className="text-sm font-heading font-semibold text-foreground mb-3">New Availability</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType("recurring")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left",
                  scheduleType === "recurring"
                    ? "border-primary bg-primary/5"
                    : "border-border/30 bg-card hover:border-primary/20"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                  scheduleType === "recurring" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  <Repeat className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">Weekly</p>
                  <p className="text-[10px] text-muted-foreground">Repeats every week</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("specific")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left",
                  scheduleType === "specific"
                    ? "border-primary bg-primary/5"
                    : "border-border/30 bg-card hover:border-primary/20"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                  scheduleType === "specific" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">Specific Date</p>
                  <p className="text-[10px] text-muted-foreground">One-time session</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2 — Allowed Training Types */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Allowed Training Types <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAINING_TYPES.map((tt) => {
                const Icon = tt.icon;
                const isSelected = allowedTypes.includes(tt.value);
                return (
                  <button
                    key={tt.value}
                    type="button"
                    onClick={() => toggleType(tt.value)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 transition-all text-xs font-bold",
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border/30 bg-card text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    {tt.label}
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Participants</label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger className="h-11 rounded-xl bg-background border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "participant" : "participants"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto Approve Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setAutoApprove(!autoApprove)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all text-left",
                autoApprove ? "border-primary/30 bg-primary/5" : "border-border/30 bg-card"
              )}
            >
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                autoApprove ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              )}>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground leading-tight">Auto-approve bookings</p>
                <p className="text-[10px] text-muted-foreground">
                  {autoApprove ? "Bookings confirmed instantly" : "You must approve each booking"}
                </p>
              </div>
              {autoApprove ? (
                <ToggleRight className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
            </button>
          </div>

          {/* Step 3 — Days or Date */}
          {scheduleType === "recurring" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Days of the week</label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={cn(
                        "h-10 px-3.5 rounded-xl text-xs font-bold transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-11 rounded-xl bg-background border-border/50",
                      !specificDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {specificDate ? format(specificDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border/50 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDate}
                    onSelect={(d) => { setSpecificDate(d); setCalendarOpen(false); }}
                    disabled={(d) => { const today = new Date(); today.setHours(0,0,0,0); return d < today; }}
                    className={cn("p-3 pointer-events-auto")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Step 4 — Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Time</label>
              <Select value={newStart} onValueChange={setNewStart}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Time</label>
              <Select value={newEnd} onValueChange={setNewEnd}>
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={resetForm} className="rounded-xl h-9">Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving} className="rounded-xl h-9 px-5">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Display ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recurring weekly */}
          {recurringSlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Recurring Weekly</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {allDays.filter((d) => d.slots.length > 0).map((day) => (
                  <div key={day.value} className="rounded-xl border bg-card border-border/50 p-3">
                    <span className="text-xs font-heading font-semibold text-foreground block mb-2">{day.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((slot) => (
                        <SlotChip key={slot.id} slot={slot} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specific dates */}
          {specificByDate.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Specific Dates</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {specificByDate.map(([dateStr, dateSlots]) => {
                  const d = new Date(dateStr + "T00:00:00");
                  const label = format(d, "EEEE, MMM d");
                  const isPast = d < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
                  return (
                    <div key={dateStr} className={cn("rounded-xl border p-3", isPast ? "bg-secondary/30 border-border/20 opacity-60" : "bg-card border-border/50")}>
                      <span className="text-xs font-heading font-semibold text-foreground block mb-2">{label}</span>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots.map((slot) => (
                          <SlotChip key={slot.id} slot={slot} onToggle={handleToggle} onDelete={handleDelete} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {recurringSlots.length === 0 && specificSlots.length === 0 && (
            <div className="text-center py-10">
              <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No availability set yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tap "Add Slot" to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 pt-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/20 border border-primary/30" /> Active
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm bg-secondary/80 border border-border/30" /> Inactive
        </div>
      </div>
    </div>
  );
};

/* ── Reusable slot chip ── */
function SlotChip({
  slot, onToggle, onDelete,
}: {
  slot: AvailabilitySlot;
  onToggle: (s: AvailabilitySlot) => void;
  onDelete: (s: AvailabilitySlot) => void;
}) {
  const types = slot.allowed_training_types || [];
  const typeLabel = types.map(t => t === "personal" ? "1:1" : "Group").join(" · ");
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs group transition-all",
      slot.is_active ? "bg-primary/10 border border-primary/20" : "bg-secondary/80 border border-border/30 opacity-60"
    )}>
      <Clock className={cn("h-3 w-3 shrink-0", slot.is_active ? "text-primary" : "text-muted-foreground")} />
      <div className="flex flex-col gap-0.5">
        <span className={cn("font-medium leading-none", slot.is_active ? "text-foreground" : "text-muted-foreground line-through")}>
          {formatHour(slot.start_time)} – {formatHour(slot.end_time)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground leading-none">{typeLabel}</span>
          {slot.max_participants > 1 && (
            <span className="text-[10px] text-muted-foreground leading-none">· max {slot.max_participants}</span>
          )}
          {slot.auto_approve && (
            <ShieldCheck className="h-2.5 w-2.5 text-primary" />
          )}
        </div>
      </div>
      <button onClick={() => onToggle(slot)} className="ml-1 transition-colors" title={slot.is_active ? "Deactivate" : "Activate"}>
        {slot.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
      </button>
      <button onClick={() => onDelete(slot)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" title="Remove">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default ScheduleManager;
