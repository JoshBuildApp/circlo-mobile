import { Link } from "react-router-dom";
import { Dumbbell, Swords, Target, Flame, Heart, Circle, Dribbble, Waves } from "lucide-react";

const categories = [
  { label: "Padel", icon: Target },
  { label: "Fitness", icon: Dumbbell },
  { label: "Tennis", icon: Swords },
  { label: "Boxing", icon: Flame },
  { label: "Yoga", icon: Heart },
  { label: "Soccer", icon: Circle },
  { label: "Basketball", icon: Dribbble },
  { label: "Swimming", icon: Waves },
];

const CategoryChips = () => (
  <div className="px-5 pt-8">
    <h2 className="text-base font-bold text-foreground tracking-tight mb-4">Browse by Sport</h2>
    <div className="flex w-full max-w-full gap-2.5 overflow-x-auto hide-scrollbar pb-1">
      {categories.map((c) => (
        <Link
          key={c.label}
          to="/discover"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 text-foreground text-xs font-medium active:scale-95 transition-all duration-200 hover:bg-secondary"
        >
          <c.icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
          {c.label}
        </Link>
      ))}
    </div>
  </div>
);

export default CategoryChips;
