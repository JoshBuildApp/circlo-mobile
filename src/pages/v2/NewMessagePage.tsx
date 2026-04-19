import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton, Avatar, Chip } from "@/components/v2/shared";
import { useCoaches, useMessageThreads } from "@/hooks/v2/useMocks";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "coaches", "circles", "players"] as const;
type Filter = typeof FILTERS[number];

export default function NewMessagePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const { data: coaches = [] } = useCoaches();
  const { data: threads = [] } = useMessageThreads();
  const channels = threads.filter((t) => t.isChannel);

  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-2.5 flex justify-between items-center">
        <RoundButton ariaLabel="Close" variant="solid-navy" size="sm" onClick={() => navigate("/v2/messages")}>
          <X size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">New message</h3>
        <div className="w-9" />
      </header>

      <div className="px-5 pt-4 pb-2.5">
        <div className="text-[12px] text-v2-muted mb-2.5">To:</div>
        <div className="px-3.5 py-2.5 rounded-[12px] bg-navy-card flex items-center gap-2.5">
          <Search size={16} className="text-v2-muted" />
          <input autoFocus placeholder="Search name, sport, circle..." className="flex-1 bg-transparent border-none outline-none text-offwhite text-sm placeholder:text-v2-muted" />
        </div>
      </div>

      <div className="flex gap-2 px-5 pb-3.5 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-2 rounded-full font-semibold text-[13px] capitalize whitespace-nowrap",
              filter === f ? "bg-teal text-navy-deep" : "bg-navy-card text-offwhite"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">SUGGESTED · based on your recent activity</div>
      <div className="px-1.5">
        {coaches.slice(0, 3).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/messages/th-${c.id}`)}
            className="w-full flex gap-3 items-center px-3.5 py-3 border-b border-navy-line text-left"
          >
            <Avatar size={44} gradient={c.avatarGradient} online={c.isOnline} />
            <div className="flex-1">
              <div className="text-[14px] font-bold flex items-center gap-1.5">
                {c.name}
                <Chip variant="teal" className="text-[9px] !px-1.5 !py-0.5">COACH</Chip>
              </div>
              <div className="text-[12px] text-v2-muted mt-0.5">{c.tagline}</div>
            </div>
            {c.isOnline && <div className="text-[10px] text-teal font-bold">ACTIVE</div>}
          </button>
        ))}
      </div>

      <div className="px-5 pt-3 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">CHANNELS</div>
      <div className="px-1.5">
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/v2/messages/${c.id}`)}
            className="w-full flex gap-3 items-center px-3.5 py-3 border-b border-navy-line text-left"
          >
            <Avatar
              size={44}
              gradient="teal-mint"
              initials={c.peerName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            />
            <div className="flex-1">
              <div className="text-[14px] font-bold">{c.peerName}</div>
              <div className="text-[12px] text-v2-muted mt-0.5">
                {c.channelMemberCount?.toLocaleString()} members · {threads.find((t) => t.id === c.id) ? "joined" : "public"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </PhoneFrame>
  );
}
