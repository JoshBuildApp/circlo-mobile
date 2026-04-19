import { Calendar, Video, Repeat, Clock, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/v2/currency";
import type { ShopItem } from "@/types/v2";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Calendar> = {
  calendar: Calendar,
  video: Video,
  repeat: Repeat,
  clock: Clock,
};

export function ShopTab({ items }: { items: ShopItem[] }) {
  const featured = items.find((i) => i.isFeatured);
  const grid = items.filter((i) => !i.isFeatured);

  return (
    <div className="pb-32">
      <div className="px-5 pb-2 text-[10px] text-v2-muted font-bold tracking-wider uppercase">FEATURED</div>
      {featured && (
        <div
          className="mx-5 mb-3.5 p-4 rounded-[18px] relative overflow-hidden"
          data-grad="orange-soft"
        >
          <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-orange tracking-wider uppercase">
            ★ BEST SELLER
          </div>
          <h3 className="mt-2.5 text-[20px] font-extrabold tracking-tight">{featured.title}</h3>
          <p className="mt-1 text-[12px] text-v2-muted">{featured.subtitle}</p>
          <div className="flex justify-between items-end mt-3.5">
            <div>
              <div className="text-[22px] font-extrabold tnum">
                {formatPrice(featured.priceILS)} <span className="text-[11px] text-v2-muted ml-1 uppercase">{featured.priceLabel}</span>
              </div>
            </div>
            <button className="bg-offwhite text-navy-deep px-4 py-2 rounded-full font-bold text-[13px] flex items-center gap-1.5">
              Buy <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 px-5">
        {grid.map((it) => {
          const Icon = ICONS[it.icon] ?? Calendar;
          return (
            <div
              key={it.id}
              className={cn(
                "rounded-[16px] p-3.5 h-[150px] flex flex-col justify-between",
                it.variant === "teal" && "bg-teal text-navy-deep",
                it.variant === "orange" && "bg-orange text-white",
                it.variant === "teal-2" && "bg-[#02a683] text-navy-deep",
                it.variant === "dark" && "bg-navy-card text-offwhite"
              )}
            >
              <div className="w-9 h-9 rounded-[10px] bg-black/20 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <div>
                <h4 className="text-[14px] font-bold">{it.title}</h4>
                <p className="text-[11px] opacity-80 mt-0.5">{it.subtitle} · {formatPrice(it.priceILS)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
