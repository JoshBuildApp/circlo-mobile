import { usePlatform } from "@/native/useNative";
import { cn } from "@/lib/utils";

/**
 * Dev-only mock status bar ("9:41 / battery"). Hidden on Capacitor native
 * builds so the real iOS/Android status bar is used.
 */
export function StatusBar({ className }: { className?: string }) {
  const { isNative } = usePlatform();
  if (isNative) return null;
  return (
    <div
      className={cn(
        "v2-safe-top flex items-start justify-between px-7 pt-3 text-sm font-semibold text-offwhite",
        className
      )}
      style={{ minHeight: 44 }}
    >
      <span className="tnum">9:41</span>
      <span className="text-xs">••••</span>
    </div>
  );
}
