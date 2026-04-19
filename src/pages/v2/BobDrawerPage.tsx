import { useNavigate } from "react-router-dom";
import { Search, Plus, Pin } from "lucide-react";
import { PhoneFrame, StatusBar, Avatar } from "@/components/v2/shared";
import { CoachOnly } from "@/components/v2/bob/CoachOnly";
import { useBobThreads, useMyCoachProfile } from "@/hooks/v2/useMocks";
import type { BobThread } from "@/types/v2";

function groupThreads(threads: BobThread[]) {
  const pinned = threads.filter((t) => t.pinned);
  const today: BobThread[] = [];
  const week: BobThread[] = [];
  const older: BobThread[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  threads
    .filter((t) => !t.pinned)
    .forEach((t) => {
      const age = now - new Date(t.updatedAt).getTime();
      if (age < dayMs) today.push(t);
      else if (age < 7 * dayMs) week.push(t);
      else older.push(t);
    });
  return { pinned, today, week, older };
}

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const days = Math.floor(h / 24);
  if (days < 7) return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return d.toLocaleDateString();
}

export default function BobDrawerPage() {
  const navigate = useNavigate();
  const { data: threads = [] } = useBobThreads();
  const { data: coach } = useMyCoachProfile();
  const groups = groupThreads(threads);

  const Section = ({ label, items, icon }: { label: string; items: BobThread[]; icon?: React.ReactNode }) => {
    if (!items.length) return null;
    return (
      <div className="px-5 mb-4">
        <div className="text-[10px] text-v2-muted font-bold tracking-widest mb-2 flex items-center gap-1">
          {icon}{label}
        </div>
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate("/v2/bob?chat=1")}
            className="w-full flex justify-between py-2.5 px-3 rounded-[10px] hover:bg-navy-card-2 mb-1 text-left"
          >
            <div>
              <div className="text-[13px] font-semibold">{t.title}</div>
              <div className="text-[11px] text-v2-muted mt-0.5 truncate">{t.preview}</div>
            </div>
            <div className="text-[10px] text-v2-muted ml-2 shrink-0 self-start mt-0.5">{relTime(t.updatedAt)}</div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <CoachOnly>
      <PhoneFrame className="min-h-[100dvh] pb-12">
        <StatusBar />
        <header className="px-5 py-5 flex justify-between items-center">
          <div className="flex gap-2.5 items-center">
            <Avatar size={36} gradient="teal-gold" />
            <div>
              <h4 className="text-[15px] font-bold">{coach?.firstName ?? "Maya"}</h4>
              <p className="text-[11px] text-orange font-bold">Circlo Pro</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/v2/bob?chat=1")}
            aria-label="New chat"
            className="w-9 h-9 rounded-full bg-orange text-white flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </header>

        <div className="mx-5 mb-4 px-3.5 py-2.5 rounded-[12px] bg-navy-card flex items-center gap-2 text-v2-muted text-sm">
          <Search size={14} />
          Search threads
        </div>

        <Section label="PINNED" items={groups.pinned} icon={<Pin size={10} />} />
        <Section label="TODAY" items={groups.today} />
        <Section label="THIS WEEK" items={groups.week} />
        <Section label="OLDER" items={groups.older} />
      </PhoneFrame>
    </CoachOnly>
  );
}
