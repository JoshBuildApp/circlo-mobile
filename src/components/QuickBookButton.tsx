import { Calendar } from "lucide-react";

interface QuickBookButtonProps {
  price: number;
  onClick: () => void;
  variant?: "default" | "compact" | "wide";
  className?: string;
}

const QuickBookButton = ({ price, onClick, variant = "default", className = "" }: QuickBookButtonProps) => {
  if (variant === "compact") {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-gradient text-white text-[10px] font-bold shadow-brand-sm active:scale-90 transition-all hover:brightness-110 ${className}`}
      >
        <Calendar className="h-3 w-3" />
        Book · ${price}
      </button>
    );
  }

  if (variant === "wide") {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
        className={`w-full h-12 rounded-2xl bg-brand-gradient text-white font-heading font-bold text-sm shadow-brand-sm active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 ${className}`}
      >
        <Calendar className="h-4 w-4" />
        Book Session · ${price}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`h-11 px-5 rounded-2xl bg-brand-gradient text-white font-heading font-bold text-sm shadow-brand-sm active:scale-95 transition-all hover:brightness-110 flex items-center gap-2 ${className}`}
    >
      <Calendar className="h-4 w-4" />
      Book · ${price}
    </button>
  );
};

export default QuickBookButton;
