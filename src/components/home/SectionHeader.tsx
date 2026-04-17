import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface SectionHeaderProps {
  title: string;
  linkTo?: string;
  linkLabel?: string;
  icon?: ReactNode;
}

const SectionHeader = ({ title, linkTo, linkLabel, icon }: SectionHeaderProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="flex items-center gap-0.5 text-xs text-primary font-semibold touch-target justify-end hover:text-primary/80 transition-colors"
        >
          {linkLabel || t("home.section.seeAll")}
          <ChevronRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
