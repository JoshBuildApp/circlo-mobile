import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  showBack?: boolean;
  sticky?: boolean;
  centerTitle?: boolean;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  actions,
  children,
  showBack,
  sticky,
  centerTitle,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "px-4 pt-4 pb-3 bg-background",
        sticky && "sticky top-0 z-30 border-b border-border/10",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
        )}
        <div className={cn("flex-1 min-w-0", centerTitle && "text-center")}>
          <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
