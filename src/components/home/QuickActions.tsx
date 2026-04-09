import { Link } from "react-router-dom";
import { CalendarDays, Search, MapPin } from "lucide-react";

const actions = [
  { label: "Book session", icon: CalendarDays, to: "/discover" },
  { label: "Find coaches", icon: Search, to: "/discover" },
  { label: "Near you", icon: MapPin, to: "/discover" },
];

const QuickActions = () => (
  <div className="flex w-full max-w-full gap-2 px-4 py-2 overflow-x-auto hide-scrollbar">
    {actions.map((a) => (
      <Link
        key={a.label}
        to={a.to}
        className="flex items-center gap-2 flex-shrink-0 px-4 h-10 rounded-full bg-secondary text-foreground text-[13px] font-medium active:scale-95 transition-all touch-target"
      >
        <a.icon className="h-4 w-4" strokeWidth={1.8} />
        {a.label}
      </Link>
    ))}
  </div>
);

export default QuickActions;
