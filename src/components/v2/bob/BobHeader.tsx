import { ChevronLeft, MoreHorizontal, Menu, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RoundButton } from "@/components/v2/shared";

interface BobHeaderProps {
  title?: string;
  sub?: string;
  onMenu?: () => void;
  showMore?: boolean;
}

export function BobHeader({ title = "Bob", sub, onMenu, showMore }: BobHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="px-5 pt-3.5 flex items-center justify-between">
      <RoundButton
        ariaLabel="Back"
        variant="solid-navy"
        size="sm"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={14} />
      </RoundButton>
      <button
        onClick={onMenu ?? (() => navigate("/v2/bob/threads"))}
        className="flex items-center gap-2 font-bold text-[15px]"
      >
        <span className="w-[22px] h-[22px] rounded-md bg-orange flex items-center justify-center">
          <Bot size={12} stroke="white" />
        </span>
        <span>
          <span className="block">{title}</span>
          {sub && <span className="block text-[10px] text-teal font-bold">{sub}</span>}
        </span>
      </button>
      <RoundButton
        ariaLabel={showMore ? "More" : "Menu"}
        variant="solid-navy"
        size="sm"
        onClick={() => (showMore ? navigate("/v2/bob/settings") : navigate("/v2/bob/threads"))}
      >
        {showMore ? <MoreHorizontal size={16} /> : <Menu size={16} />}
      </RoundButton>
    </header>
  );
}
