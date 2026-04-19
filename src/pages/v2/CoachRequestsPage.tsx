import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, Menu } from "lucide-react";
import { PhoneFrame, StatusBar, TabBar, RoundButton, Avatar, Chip } from "@/components/v2/shared";
import { RequestCard } from "@/components/v2/coach/RequestCard";
import { useBookingRequests, useBookingRequestAction } from "@/hooks/v2/useMocks";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "new", label: "New" },
  { key: "responded", label: "Responded" },
  { key: "declined", label: "Declined" },
] as const;
type Tab = typeof TABS[number]["key"];

export default function CoachRequestsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new");
  const { data: requests = [] } = useBookingRequests(tab);
  const action = useBookingRequestAction();

  return (
    <PhoneFrame className="min-h-[100dvh] pb-28">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/coach-me")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">Booking requests</h3>
        <RoundButton ariaLabel="Menu" variant="solid-navy" size="sm">
          <Menu size={14} />
        </RoundButton>
      </header>

      <div className="flex bg-navy-card rounded-[14px] p-1 mx-5 mt-4 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2.5 rounded-[10px] text-[13px] font-bold capitalize",
              tab === t.key ? "bg-navy-card-2 text-offwhite" : "text-v2-muted"
            )}
          >
            {t.label}
            {t.key === "new" && requests.length > 0 && tab === "new" && (
              <span className="bg-orange text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1.5 tnum">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">
        {tab === "new" ? "AWAITING YOUR REPLY · avg response 12m" : tab.toUpperCase()}
      </div>

      <div className="px-5 flex flex-col gap-2">
        {requests.length === 0 ? (
          <div className="text-center text-v2-muted text-[13px] py-12">
            {tab === "new" ? "No new requests · you're all caught up." : `No ${tab} requests.`}
          </div>
        ) : (
          requests.map((r) => (
            <RequestCard
              key={r.id}
              req={r}
              detailed
              onAccept={() => action.mutate({ id: r.id, action: "accept" })}
              onDecline={() => action.mutate({ id: r.id, action: "decline" })}
            />
          ))
        )}
      </div>

      <div className="px-5 pt-5 pb-2 text-[10px] text-v2-muted font-bold tracking-widest uppercase">YESTERDAY</div>
      <div className="px-5 flex flex-col gap-2 mb-5">
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-2.5 items-center">
          <Avatar size={36} gradient="teal-gold" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Shira Amit</div>
            <div className="text-[11px] text-v2-muted mt-0.5">1-on-1 · Sat · Accepted</div>
          </div>
          <Chip variant="teal" className="text-[10px]">✓ Accepted</Chip>
        </div>
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-2.5 items-center">
          <Avatar size={36} gradient="orange-peach" />
          <div className="flex-1">
            <div className="text-[13px] font-bold">Omer Dagan</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Time conflict · Declined with suggestion</div>
          </div>
          <span className="text-[10px] text-v2-muted font-bold tracking-wider">DECLINED</span>
        </div>
      </div>

      <TabBar mode="coach" active="messages" />
    </PhoneFrame>
  );
}
