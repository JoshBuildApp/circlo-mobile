import { ChevronLeft, Share2, Flag } from "lucide-react";
import { Avatar, RoundButton, Chip } from "@/components/v2/shared";
import type { Coach } from "@/types/v2";
import { cn } from "@/lib/utils";
import { useShare } from "@/native/useNative";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isShopEnabled } from "@/lib/v2/featureFlag";

interface CoachProfileHeroProps {
  coach: Coach;
  activeTab: "about" | "community" | "content" | "shop";
  onTab: (t: "about" | "community" | "content" | "shop") => void;
  onBack: () => void;
}

export function CoachProfileHero({ coach, activeTab, onTab, onBack }: CoachProfileHeroProps) {
  const share = useShare();
  const handleShare = async () => {
    const url = `https://circloclub.com/coach/${coach.id}`;
    try {
      await share({
        title: `${coach.name} on Circlo`,
        text: coach.tagline,
        url,
      });
    } catch {
      // Fallback: copy URL
      try {
        await navigator.clipboard?.writeText(url);
        toast.success("Link copied to clipboard.");
      } catch {
        toast("Share unavailable. URL: " + url);
      }
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this profile? (e.g., spam, inappropriate content, harassment)");
    if (!reason) return;
    try {
      await supabase.from("moderation_reports").insert({
        target_type: "coach_profile",
        target_id: coach.id,
        reason
      });
    } catch {
      // Ignore if table not set up
    }
    toast.success("Thank you. We have received your report and will review this profile.");
  };
  return (
    <div data-grad="hero-teal" className="px-5 pt-5 relative">
      <div className="flex justify-between items-center mb-5">
        <RoundButton ariaLabel="Back" onClick={onBack}>
          <ChevronLeft size={16} />
        </RoundButton>
        <div className="flex gap-2">
          <RoundButton ariaLabel="Report or Block" onClick={handleReport}>
            <Flag size={16} />
          </RoundButton>
          <RoundButton ariaLabel="Share" onClick={handleShare}>
            <Share2 size={16} />
          </RoundButton>
        </div>
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
            ...(isShopEnabled() ? [{ key: "shop" as const, label: "Shop", num: undefined }] : []),
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
