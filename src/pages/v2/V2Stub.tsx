import { useLocation, useNavigate } from "react-router-dom";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { ChevronLeft, Wrench } from "lucide-react";

interface V2StubProps {
  title?: string;
  phase?: number;
}

/**
 * Placeholder for v2 screens not yet implemented. Each phase replaces
 * specific routes with their real page; anything still stubbed will
 * render this card.
 */
export default function V2Stub({ title, phase }: V2StubProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const derivedTitle = title ?? location.pathname.replace(/^\/v2\//, "").replace(/[-/]/g, " · ");

  return (
    <PhoneFrame className="min-h-[100dvh]">
      <StatusBar />
      <header className="px-5 pt-2 flex items-center justify-between">
        <RoundButton variant="solid-navy" size="sm" ariaLabel="Back" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
        </RoundButton>
        <div className="text-[14px] font-bold capitalize">{derivedTitle}</div>
        <div className="w-9" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-24 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-teal-dim text-teal flex items-center justify-center">
          <Wrench size={28} />
        </div>
        <div>
          <div className="text-[11px] font-bold text-teal tracking-wider uppercase">
            {phase !== undefined ? `Phase ${phase}` : "Under construction"}
          </div>
          <h1 className="mt-2 text-[22px] font-extrabold tracking-tight text-offwhite capitalize">
            {derivedTitle}
          </h1>
          <p className="mt-2 text-[13px] text-v2-muted leading-relaxed">
            This screen is wired up and has data flowing, but its UI is still
            being built. Check back once the parent phase ships.
          </p>
        </div>
        <button
          onClick={() => navigate("/v2/home")}
          className="px-5 py-3 rounded-[14px] bg-navy-card text-offwhite font-bold text-[13px]"
        >
          Back to home
        </button>
      </main>
    </PhoneFrame>
  );
}
