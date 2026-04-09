import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkLabel?: string;
  icon?: ReactNode;
}

const SectionHeader = ({ title, linkTo, linkLabel, icon }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      {icon}
      <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
    </div>
    {linkTo && (
      <Link
        to={linkTo}
        className="flex items-center gap-0.5 text-[12px] text-primary font-semibold touch-target justify-end hover:text-primary/80 transition-colors"
      >
        {linkLabel || "See all"}
        <ChevronRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
