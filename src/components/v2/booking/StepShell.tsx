import { type ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RoundButton } from "@/components/v2/shared";
import { cn } from "@/lib/utils";

interface StepShellProps {
  step: number;
  totalSteps: number;
  topBarCenter: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  stepLabel: string;
  title: string;
  sub?: string;
  children: ReactNode;
  bottomBar: ReactNode;
}

export function StepShell({
  step,
  totalSteps,
  topBarCenter,
  onBack,
  onClose,
  stepLabel,
  title,
  sub,
  children,
  bottomBar,
}: StepShellProps) {
  const navigate = useNavigate();
  return (
    <>
      <header className="px-5 pt-3.5 flex justify-between items-center">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={onBack ?? (() => navigate(-1))}>
          <ChevronLeft size={14} />
        </RoundButton>
        <div className="flex items-center gap-2 text-[14px] font-bold">{topBarCenter}</div>
        <RoundButton ariaLabel="Close" variant="solid-navy" size="sm" onClick={onClose ?? (() => navigate("/v2/home"))}>
          <X size={14} />
        </RoundButton>
      </header>
      <div className="flex gap-1 px-5 pt-3 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={cn("flex-1 h-[3px] rounded-sm", i < step ? "bg-orange" : "bg-navy-card")} />
        ))}
      </div>
      <div className="px-5">
        <div className="text-[10px] text-v2-muted tracking-widest font-bold mb-2">{stepLabel}</div>
        <h1 className="text-[28px] font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="text-[13px] text-v2-muted mt-1.5">{sub}</p>}
      </div>
      <main className="flex-1 pb-32 mt-5">{children}</main>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-5 py-3.5 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line v2-safe-bottom">
        {bottomBar}
      </div>
    </>
  );
}
