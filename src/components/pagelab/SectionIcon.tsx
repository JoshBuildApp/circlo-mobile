import {
  Film, Image, Users, BookOpen, Dumbbell, Star,
  Info, CalendarDays, Trophy, Lock, LayoutGrid, ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Film, Image, Users, BookOpen, Dumbbell, Star,
  Info, CalendarDays, Trophy, Lock, ShoppingBag,
};

interface SectionIconProps {
  iconName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const SectionIcon = ({ iconName, className, size = "md" }: SectionIconProps) => {
  const Icon = iconName ? ICON_MAP[iconName] : LayoutGrid;
  if (!Icon) return <LayoutGrid className={cn(SIZE_MAP[size], "text-muted-foreground", className)} />;
  return <Icon className={cn(SIZE_MAP[size], className)} strokeWidth={1.8} />;
};

export default SectionIcon;
