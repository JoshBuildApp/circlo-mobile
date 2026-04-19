import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Dumbbell, Heart as HeartIcon, Wind, Activity, Moon } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { useAddWorkout } from "@/hooks/v2/useMocks";
import { cn } from "@/lib/utils";
import type { WorkoutType } from "@/types/v2";

const TYPES: { key: WorkoutType; label: string; icon: typeof Dumbbell }[] = [
  { key: "strength", label: "Strength", icon: Dumbbell },
  { key: "cardio", label: "Cardio", icon: HeartIcon },
  { key: "mobility", label: "Mobility", icon: Wind },
  { key: "sport", label: "Sport", icon: Activity },
  { key: "recovery", label: "Recovery", icon: Moon },
];

export default function AddWorkoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialDate = params.get("date") ?? new Date().toISOString().slice(0, 10);
  const add = useAddWorkout();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<WorkoutType>("strength");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("17:00");
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [weeks, setWeeks] = useState(4);

  const submit = async () => {
    if (!title.trim()) return;
    const startsAt = new Date(`${date}T${time}:00`);
    const adds = repeat ? weeks : 1;
    for (let w = 0; w < adds; w++) {
      const d = new Date(startsAt);
      d.setDate(d.getDate() + w * 7);
      await add.mutateAsync({
        type: "workout",
        title,
        startsAt: d.toISOString(),
        durationMin: duration,
        workoutType: type,
        notes: notes || undefined,
      });
    }
    navigate(`/v2/calendar/${date}`);
  };

  return (
    <PhoneFrame className="min-h-[100dvh] pb-32">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Close" variant="solid-navy" size="sm" onClick={() => navigate(-1)}>
          <X size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">New workout</h3>
        <div className="w-9" />
      </header>

      <main className="px-5 pt-5 pb-32 flex flex-col gap-5">
        <div>
          <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Leg day at the gym"
            className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none placeholder:text-v2-muted focus:border-teal"
          />
        </div>

        <div>
          <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const sel = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 rounded-md text-[10px] font-semibold",
                    sel ? "bg-teal text-navy-deep" : "bg-navy-card text-v2-muted"
                  )}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal" />
          </div>
          <div>
            <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal" />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Duration · {duration} min</label>
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full accent-teal"
          />
        </div>

        <div>
          <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Notes <span className="font-medium normal-case text-v2-muted-2">· optional</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to remember..."
            className="w-full px-3.5 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none min-h-[70px] resize-none focus:border-teal"
          />
        </div>

        <div className="flex justify-between items-center bg-navy-card p-3.5 rounded-[12px]">
          <div>
            <div className="text-[14px] font-bold">Repeat weekly</div>
            <div className="text-[11px] text-v2-muted mt-0.5">{repeat ? `For ${weeks} weeks` : "One-time event"}</div>
          </div>
          <button
            onClick={() => setRepeat(!repeat)}
            className={cn("w-11 h-[26px] rounded-full relative transition-colors", repeat ? "bg-teal" : "bg-navy-line")}
          >
            <span className={cn("absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all", repeat ? "right-[3px]" : "left-[3px]")} />
          </button>
        </div>

        {repeat && (
          <div>
            <label className="text-[11px] text-v2-muted font-bold tracking-wider uppercase block mb-2">Number of weeks</label>
            <input
              type="number"
              min={2}
              max={12}
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value) || 4)}
              className="w-full px-3 py-3 rounded-[12px] bg-navy-card border border-navy-line text-offwhite text-sm outline-none focus:border-teal tnum"
            />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 py-3.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        <button
          onClick={submit}
          disabled={!title.trim() || add.isPending}
          className="w-full py-3.5 rounded-[14px] bg-teal text-navy-deep font-bold text-[14px] disabled:opacity-50"
        >
          {add.isPending ? "Adding…" : "Add to calendar"}
        </button>
      </div>
    </PhoneFrame>
  );
}
