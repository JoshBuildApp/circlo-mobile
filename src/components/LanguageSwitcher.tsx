import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { SUPPORTED_LANGS } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "icon" | "compact";
}

const LANG_LABEL: Record<string, string> = {
  en: "English",
  he: "עברית",
};

const LANG_SHORT: Record<string, string> = {
  en: "EN",
  he: "עב",
};

const LanguageSwitcher = ({ className, variant = "icon" }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = (i18n.language || "en").split("-")[0];

  const switchTo = (lng: string) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("common.language")}
          title={t("common.language")}
          className={cn(
            "h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all",
            variant === "icon" ? "w-8" : "px-2.5 gap-1.5 text-[12px] font-medium",
            className,
          )}
        >
          <Globe className="h-[17px] w-[17px]" strokeWidth={1.8} />
          {variant === "compact" && (
            <span className="hidden sm:inline">{LANG_SHORT[current] || current.toUpperCase()}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-1.5 rounded-2xl border-border/20 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
          {t("common.language")}
        </p>
        {SUPPORTED_LANGS.map((lng) => {
          const active = current === lng;
          return (
            <button
              key={lng}
              type="button"
              onClick={() => switchTo(lng)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-foreground/5",
              )}
            >
              <span>{LANG_LABEL[lng] || lng}</span>
              {active && <span className="text-primary text-xs">●</span>}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default LanguageSwitcher;
