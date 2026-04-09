import { MapPin, Trophy, Flame } from "lucide-react";

interface QuickFiltersProps {
  selected: string | null;
  onSelect: (filter: string | null) => void;
}

const filters = [
  { label: "Near me", icon: MapPin, value: "near-me" },
  { label: "Boxing", icon: Flame, value: "Boxing" },
  { label: "Tennis", icon: null, value: "Tennis" },
  { label: "Top rated", icon: Trophy, value: "top-rated" },
  { label: "Soccer", icon: null, value: "Soccer" },
  { label: "Yoga", icon: null, value: "Yoga" },
];

const QuickFilters = ({ selected, onSelect }: QuickFiltersProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2">
      {filters.map((f) => {
        const active = selected === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onSelect(active ? null : f.value)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
              active
                ? "bg-primary text-primary-foreground glow-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-border/50"
            }`}
          >
            {f.icon && <f.icon className="h-3.5 w-3.5" />}
            {f.label}
          </button>
        );
      })}
    </div>
  );
};

export default QuickFilters;
