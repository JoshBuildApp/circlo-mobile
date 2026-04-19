import { ChevronRight } from "lucide-react";

interface BookingBarProps {
  nextLabel: string;
  onBook: () => void;
}

/**
 * Sticky bottom bar shown on the coach profile tabs.
 * Sits above the TabBar (TabBar is z-50, BookingBar is z-40).
 */
export function BookingBar({ nextLabel, onBook }: BookingBarProps) {
  return (
    <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-[rgba(10,10,15,0.95)] backdrop-blur-xl border-t border-navy-line px-4 py-3 flex items-center justify-between">
      <div>
        <div className="text-[10px] text-v2-muted font-bold tracking-wider">NEXT AVAILABLE</div>
        <div className="text-[14px] font-bold text-offwhite">{nextLabel}</div>
      </div>
      <button
        onClick={onBook}
        className="px-6 py-3 rounded-[14px] bg-orange text-white font-bold text-[14px] flex items-center gap-1.5"
      >
        Book <ChevronRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
