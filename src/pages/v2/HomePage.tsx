import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, MessageSquare } from "lucide-react";
import {
  PhoneFrame,
  StatusBar,
  TabBar,
  HScroll,
  SectionHeader,
  Avatar,
  RoundButton,
} from "@/components/v2/shared";
import { LiveCard } from "@/components/v2/home/LiveCard";
import { CoachCard } from "@/components/v2/home/CoachCard";
import { PostRow } from "@/components/v2/home/PostRow";
import { useCoaches, useCirclePosts, useMyPlayerProfile } from "@/hooks/v2/useMocks";

export default function HomePageV2() {
  const navigate = useNavigate();
  const { data: me } = useMyPlayerProfile();
  const { data: coaches = [] } = useCoaches();
  const { data: posts = [] } = useCirclePosts();
  const greeting = greetingFor(new Date());

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-1.5 flex items-center justify-between">
        <div>
          <div className="text-[12px] text-v2-muted">{greeting.day}, good {greeting.part}</div>
          <div className="text-[28px] font-extrabold tracking-tight leading-tight">
            Hey, {me?.firstName ?? "there"} <span className="text-[24px]">👋</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <RoundButton
            size="sm"
            variant="solid-navy"
            ariaLabel="Messages"
            onClick={() => navigate("/v2/messages")}
            className="relative"
          >
            <MessageSquare size={16} />
            <span className="absolute -top-0.5 -right-0.5 bg-teal text-navy-deep text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center tnum">
              3
            </span>
          </RoundButton>
          <Avatar size={36} gradient="teal-mint" onClick={() => navigate("/v2/profile")} />
        </div>
      </header>

      <button
        onClick={() => navigate("/v2/profile/bookings")}
        className="mx-5 mt-5 mb-6 p-4 rounded-[18px] flex items-center gap-3.5 text-left"
        style={{ background: "linear-gradient(135deg, #143832, #0f2a25)" }}
      >
        <span className="w-12 h-12 rounded-xl bg-teal-dim text-teal flex items-center justify-center">
          <Calendar size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-[10px] font-extrabold tracking-wider text-teal">NEXT SESSION</span>
          <span className="block text-[15px] font-bold mt-0.5">{me?.nextSession?.when ?? "No upcoming"}</span>
        </span>
        <ChevronRight size={18} className="text-v2-muted" />
      </button>

      <SectionHeader title={<span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange v2-pulse-dot" />Live now</span>} action="See all" onAction={() => navigate("/v2/discover")} />
      <HScroll>
        <LiveCard title="Padel clinic" coach="Daniel" viewers={12} variant="orange" onClick={() => navigate("/v2/live/live-1")} />
        <LiveCard title="Serve drills" coach="Maya" viewers={8} variant="teal" onClick={() => navigate("/v2/live/live-1")} />
        <LiveCard title="Mindset" coach="Amir" viewers={5} variant="orange" onClick={() => navigate("/v2/live/live-1")} />
      </HScroll>

      <SectionHeader title="Coaches for you" action="Discover" onAction={() => navigate("/v2/discover")} />
      <HScroll>
        {coaches.slice(0, 4).map((c) => (
          <CoachCard key={c.id} coach={c} onClick={() => navigate(`/v2/coach/${c.id}`)} />
        ))}
      </HScroll>

      <SectionHeader title="From your circle" action="More" onAction={() => navigate(`/v2/coach/${coaches[0]?.id ?? "maya"}/community`)} />
      <div className="flex flex-col gap-3 px-5">
        {posts.map((p) => (
          <div key={p.id} className="-mx-5">
            <PostRow post={p} onClick={() => navigate(`/v2/coach/${coaches[0]?.id ?? "maya"}/community`)} />
          </div>
        ))}
      </div>

      <div className="text-center mt-8 mb-2 text-[11px] text-v2-muted-2">You're all caught up ✨</div>

      <TabBar mode="player" active="home" />
    </PhoneFrame>
  );
}

function greetingFor(d: Date): { day: string; part: "morning" | "afternoon" | "evening" } {
  const day = d.toLocaleDateString("en-US", { weekday: "long" });
  const h = d.getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return { day, part };
}
