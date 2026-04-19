import { ChevronLeft, Share2 } from "lucide-react";
import { Avatar, RoundButton, Chip } from "@/components/v2/shared";
import type { Coach } from "@/types/v2";
import { cn } from "@/lib/utils";

interface CoachProfileHeroProps {
  coach: Coach;
  activeTab: "about" | "community" | "content" | "shop";
  onTab: (t: "about" | "community" | "content" | "shop") => void;
  onBack: () => void;
}

export function CoachProfileHero({ coach, activeTab, onTab, onBack }: CoachProfileHeroProps) {
  return (
    <div
      className="px-5 pt-5 relative"
      style={{ background: "linear-gradient(180deg, #0d2f29 0%, #0A0A0F 70%)" }}
    >
      <div className="flex justify-between items-center mb-5">
        <RoundButton ariaLabel="Back" onClick={onBack}>
          <ChevronLeft size={16} />
        </RoundButton>
        <RoundButton ariaLabel="Share">
          <Share2 size={16} />
        </RoundButton>
      </div>

      <div className="flex justify-center gap-2 mb-3.5">
        {coach.badges.includes("verified") && <Chip variant="teal">✓ Verified</Chip>}
        {coach.badges.includes("top1") && <Chip variant="orange">Top 1%</Chip>}
        {coach.badges.includes("new") && <Chip>New</Chip>}
      </div>

      <div className="flex justify-center mb-3.5">
        <Avatar size={96} src={coach.avatarUrl} alt={coach.name} gradient={coach.avatarGradient} online={coach.isOnline} />
      </div>

      <h1 className="text-center text-[26px] font-extrabold tracking-tight text-offwhite mb-1">
        {coach.name}
      </h1>
      <div className="text-center text-v2-muted text-[13px] mb-4">{coach.tagline}</div>

      <div className="flex gap-5 px-0 border-b border-navy-line -mx-5 px-5">
        {(
          [
            { key: "about", label: "About", num: undefined },
            { key: "community", label: "Community", num: coach.followerCount },
            { key: "content", label: "Content", num: 42 },
            { key: "shop", label: "Shop", num: undefined },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            className={cn(
              "py-3 text-[15px] font-bold relative flex items-center gap-1.5",
              activeTab === t.key ? "text-offwhite" : "text-v2-muted"
            )}
          >
            {t.label}
            {t.num !== undefined && (
              <span className="text-[11px] bg-navy-card px-2 py-0.5 rounded-full text-v2-muted tnum">
                {t.num}
              </span>
            )}
            {activeTab === t.key && (
              <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-teal" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
