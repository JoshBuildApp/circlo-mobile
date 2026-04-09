import { useState, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, isBefore, isAfter, isSameDay } from "date-fns";
import {
  CalendarDays, Clock, ChevronLeft, ChevronRight, Palmtree,
  Plus, Trash2, ToggleLeft, ToggleRight, X, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAvailability, formatHour, type AvailabilitySlot } from "@/hooks/use-availability";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  coachProfileId: string;
}

const DAYS = [
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
  { value: 0, label: "Sun", full: "Sunday" },
];

// Hours from 6 AM to 10 PM
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

interface Vacation {
  id: string;
  coach_id: string;
  start_date: string;
  end_date: string;
  label: string | null;
  created_at: string;
}

function useCoachVacations(coachId: string) {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coach_vacations")
      .select("*")
      .eq("coach_id", coachId)
      .order("start_date", { ascending: true });
    if (!error) setVacations((data as Vacation[]) || []);
    setLoading(false);
  }, [coachId]);

  useState(() => { fetch(); });

  return { vacations, loading, refresh: fetch };
}

type ViewMode = "grid" | "vacation";

const VisualAvailabilityManager = ({ coachProfileId }: Props) => {
  const { slots, loading, refresh } = useAvailability(coachProfileId);
  const { vacations, refresh: refreshVacations } = useCoachVacations(coachProfileId);
  const [view, setView] = useState<ViewMode>("grid");
  const [saving, setSaving] = useState(false);

  // Track pending grid changes before save
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());
  const [pendingRemoves, setPendingRemoves] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Vacation form
  const [vacStart, setVacStart] = useState<Date | undefined>();
  const [vacEnd, setVacEnd] = useState<Date | undefined>();
  const [vacLabel, setVacLabel] = useState("");
  const [vacStartOpen, setVacStartOpen] = useState(false);
  const [vacEndOpen, setVacEndOpen] = useState(false);

  // Build a set of active recurring slots for the grid: "dayOfWeek-hour"
  const activeSlotKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const slot of slots) {
      if (slot.schedule_type !== "recurring" || !slot.is_active) continue;
      const startH = parseInt(slot.start_time.split(":")[0]);
      const endH = parseInt(slot.end_time.split(":")[0]);
      for (let h = startH; h < endH; h++) {
        keys.add(`${slot.day_of_week}-${h}`);
      }
    }
    return keys;
  }, [slots]);

  // Effective state = active + pending adds - pending removes
  const effectiveKeys = useMemo(() => {
    const keys = new Set(activeSlotKeys);
    for (const k of pendingAdds) keys.add(k);
    for (const k of pendingRemoves) keys.delete(k);
    return keys;
  }, [activeSlotKeys, pendingAdds, pendingRemoves]);

  const toggleCell = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const isCurrentlyActive = effectiveKeys.has(key);

    setPendingAdds((prev) => {
      const next = new Set(prev);
      if (!isCurrentlyActive) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    setPendingRemoves((prev) => {
      const next = new Set(prev);
      if (isCurrentlyActive) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    setIsDirty(true);
  };

  // Drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove">("add");

  const handleMouseDown = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const isActive = effectiveKeys.has(key);
    setDragMode(isActive ? "remove" : "add");
    setIsDragging(true);
    toggleCell(day, hour);
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (!isDragging) return;
    const key = `${day}-${hour}`;
    const isActive = effectiveKeys.has(key);
    if (dragMode === "add" && !isActive) toggleCell(day, hour);
    if (dragMode === "remove" && isActive) toggleCell(day, hour);
  };

  const handleMouseUp = () => setIsDragging(false);

  const discardChanges = () => {
    setPendingAdds(new Set());
    setPendingRemoves(new Set());
    setIsDirty(false);
  };

  // Save: compute the minimal set of recurring availability rows from effectiveKeys
  const handleSaveGrid = async () => {
    setSaving(true);

    // Group effective keys by day, then merge contiguous hours into ranges
    const dayHours: Record<number, number[]> = {};
    for (const key of effectiveKeys) {
      const [d, h] = key.split("-").map(Number);
      if (!dayHours[d]) dayHours[d] = [];
      dayHours[d].push(h);
    }

    // Build ranges per day
    const newRanges: { day: number; start: number; end: number }[] = [];
    for (const [day, hours] of Object.entries(dayHours)) {
      const sorted = hours.sort((a, b) => a - b);
      let rangeStart = sorted[0];
      let rangeEnd = sorted[0] + 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === rangeEnd) {
          rangeEnd = sorted[i] + 1;
        } else {
          newRanges.push({ day: Number(day), start: rangeStart, end: rangeEnd });
          rangeStart = sorted[i];
          rangeEnd = sorted[i] + 1;
        }
      }
      newRanges.push({ day: Number(day), start: rangeStart, end: rangeEnd });
    }

    // Delete all existing recurring slots for this coach
    const { error: delError } = await supabase
      .from("availability")
      .delete()
      .eq("coach_id", coachProfileId)
      .eq("schedule_type", "recurring");

    if (delError) {
      toast.error("Failed to update schedule");
      setSaving(false);
      return;
    }

    // Insert new ranges
    if (newRanges.length > 0) {
      const rows = newRanges.map((r) => ({
        coach_id: coachProfileId,
        day_of_week: r.day,
        start_time: `${r.start.toString().padStart(2, "0")}:00`,
        end_time: `${r.end.toString().padStart(2, "0")}:00`,
        is_active: true,
        schedule_type: "recurring",
        specific_date: null,
        allowed_training_types: ["personal", "group"],
        auto_approve: false,
        max_participants: 1,
      }));

      const { error: insError } = await supabase.from("availability").insert(rows);
      if (insError) {
        toast.error("Failed to save schedule");
        setSaving(false);
        return;
      }
    }

    toast.success("Schedule updated");
    setPendingAdds(new Set());
    setPendingRemoves(new Set());
    setIsDirty(false);
    setSaving(false);
    refresh();
  };

  // Vacation handlers
  const handleAddVacation = async () => {
    if (!vacStart || !vacEnd) {
      toast.error("Select both start and end dates");
      return;
    }
    if (isBefore(vacEnd, vacStart)) {
      toast.error("End date must be after start date");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("coach_vacations").insert({
      coach_id: coachProfileId,
      start_date: format(vacStart, "yyyy-MM-dd"),
      end_date: format(vacEnd, "yyyy-MM-dd"),
      label: vacLabel.trim() || null,
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Failed to add vacation");
      return;
    }
    toast.success("Vacation added");
    setVacStart(undefined);
    setVacEnd(undefined);
    setVacLabel("");
    refreshVacations();
  };

  const handleDeleteVacation = async (id: string) => {
    await supabase.from("coach_vacations").delete().eq("id", id);
    toast.success("Vacation removed");
    refreshVacations();
  };

  // Count active hours
  const activeHourCount = effectiveKeys.size;

  return (
    <div className="space-y-5" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground">Availability</h2>
            <p className="text-[11px] text-muted-foreground">
              {activeHourCount} hour{activeHourCount !== 1 ? "s" : ""} per week
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
        <button
          onClick={() => setView("grid")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
            view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Week Grid
        </button>
        <button
          onClick={() => setView("vacation")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
            view === "vacation" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          <Palmtree className="h-3.5 w-3.5" />
          Vacation Mode
        </button>
      </div>

      {/* ── Week Grid View ── */}
      {view === "grid" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click or drag to toggle hours on/off. Changes are saved when you hit "Save".
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="rounded-2xl border border-border/30 bg-card overflow-hidden select-none">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr>
                        <th className="w-16 p-2 text-[10px] text-muted-foreground font-medium text-left sticky left-0 bg-card z-10">
                          Time
                        </th>
                        {DAYS.map((d) => (
                          <th key={d.value} className="p-2 text-[10px] text-muted-foreground font-semibold text-center">
                            {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour) => (
                        <tr key={hour} className="border-t border-border/10">
                          <td className="p-1.5 text-[10px] text-muted-foreground font-medium whitespace-nowrap sticky left-0 bg-card z-10">
                            {formatHour(`${hour.toString().padStart(2, "0")}:00`)}
                          </td>
                          {DAYS.map((d) => {
                            const key = `${d.value}-${hour}`;
                            const isActive = effectiveKeys.has(key);
                            const isOriginal = activeSlotKeys.has(key);
                            const isAdded = pendingAdds.has(key) && !isOriginal;
                            const isRemoved = pendingRemoves.has(key) && isOriginal;

                            return (
                              <td key={d.value} className="p-0.5">
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); handleMouseDown(d.value, hour); }}
                                  onMouseEnter={() => handleMouseEnter(d.value, hour)}
                                  className={cn(
                                    "w-full h-7 rounded-md transition-all duration-100 border",
                                    isActive
                                      ? isAdded
                                        ? "bg-primary/30 border-primary/40 ring-1 ring-primary/20"
                                        : "bg-primary/20 border-primary/30 hover:bg-primary/30"
                                      : isRemoved
                                        ? "bg-destructive/10 border-destructive/20 ring-1 ring-destructive/20"
                                        : "bg-secondary/30 border-border/10 hover:bg-secondary/60"
                                  )}
                                  title={`${d.full} ${formatHour(`${hour.toString().padStart(2, "0")}:00`)} — ${isActive ? "Available" : "Unavailable"}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-3 w-5 rounded-sm bg-primary/20 border border-primary/30" /> Available
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-3 w-5 rounded-sm bg-secondary/30 border border-border/10" /> Off
                </div>
                {isDirty && (
                  <>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="h-3 w-5 rounded-sm bg-primary/30 border border-primary/40 ring-1 ring-primary/20" /> Added
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className="h-3 w-5 rounded-sm bg-destructive/10 border border-destructive/20 ring-1 ring-destructive/20" /> Removed
                    </div>
                  </>
                )}
              </div>

              {/* Save / Discard */}
              {isDirty && (
                <div className="flex gap-2 justify-end animate-fade-in">
                  <Button variant="ghost" size="sm" onClick={discardChanges} className="rounded-xl h-9 gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Discard
                  </Button>
                  <Button size="sm" onClick={handleSaveGrid} disabled={saving} className="rounded-xl h-9 px-5 gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {saving ? "Saving..." : "Save Schedule"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Vacation Mode View ── */}
      {view === "vacation" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Block date ranges when you're unavailable. Vacations override your recurring schedule.
          </p>

          {/* Add vacation form */}
          <div className="bg-secondary/50 rounded-2xl border border-border/50 p-4 space-y-3">
            <p className="text-sm font-heading font-semibold text-foreground">Add Vacation</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Date</label>
                <Popover open={vacStartOpen} onOpenChange={setVacStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-10 rounded-xl bg-background border-border/50 text-xs",
                        !vacStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      {vacStart ? format(vacStart, "MMM d, yyyy") : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border/50 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={vacStart}
                      onSelect={(d) => { setVacStart(d); setVacStartOpen(false); }}
                      disabled={(d) => { const today = new Date(); today.setHours(0, 0, 0, 0); return d < today; }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Date</label>
                <Popover open={vacEndOpen} onOpenChange={setVacEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left h-10 rounded-xl bg-background border-border/50 text-xs",
                        !vacEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      {vacEnd ? format(vacEnd, "MMM d, yyyy") : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border/50 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={vacEnd}
                      onSelect={(d) => { setVacEnd(d); setVacEndOpen(false); }}
                      disabled={(d) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (d < today) return true;
                        if (vacStart && isBefore(d, vacStart)) return true;
                        return false;
                      }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Label (optional)</label>
              <input
                type="text"
                value={vacLabel}
                onChange={(e) => setVacLabel(e.target.value)}
                placeholder="e.g. Summer break, Conference..."
                className="w-full h-10 px-3 rounded-xl bg-background border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddVacation} disabled={saving || !vacStart || !vacEnd} className="rounded-xl h-9 px-5 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Add Vacation"}
              </Button>
            </div>
          </div>

          {/* Existing vacations */}
          {vacations.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                Scheduled Vacations
              </span>
              {vacations.map((v) => {
                const start = new Date(v.start_date + "T00:00:00");
                const end = new Date(v.end_date + "T00:00:00");
                const isPast = isBefore(end, new Date());
                const isNow = !isBefore(end, new Date()) && !isAfter(start, new Date());
                const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

                return (
                  <div
                    key={v.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 group transition-all",
                      isPast
                        ? "bg-secondary/30 border-border/20 opacity-50"
                        : isNow
                          ? "bg-amber-500/10 border-amber-500/20"
                          : "bg-card border-border/50"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                      isNow ? "bg-amber-500/20 text-amber-600" : "bg-secondary text-muted-foreground"
                    )}>
                      <Palmtree className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight truncate">
                        {v.label || "Vacation"}
                        {isNow && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            Active now
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {format(start, "MMM d")} – {format(end, "MMM d, yyyy")} · {days} day{days !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteVacation(v.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                      title="Remove vacation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Palmtree className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No vacations scheduled</p>
              <p className="text-xs text-muted-foreground mt-1">Add dates when you won't be available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualAvailabilityManager;
