import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({ title, action, onAction, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 mt-6 mb-3", className)}>
      <h2 className="text-[17px] font-bold leading-tight tracking-tight text-offwhite">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="text-teal text-[13px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded"
        >
          {action}
        </button>
      )}
    </div>
  );
}
