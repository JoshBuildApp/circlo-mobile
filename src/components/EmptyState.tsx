import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type EmptyStateSize = "sm" | "md" | "lg";
export type EmptyStateIllustration = "calendar" | "messages" | "notifications" | "saved" | "requests";

interface EmptyStateAction {
  label: string;
  /** Navigation link — renders a styled Link */
  to?: string;
  /** Click handler — renders a Button */
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}

interface EmptyStateProps {
  /** Lucide icon component (e.g. `MessageSquare`) */
  icon: React.ElementType;
  /** Main heading */
  title: string;
  /** Supporting text below the title */
  description?: string;
  /** Primary CTA */
  action?: EmptyStateAction;
  /** Optional secondary link below the primary CTA */
  secondaryAction?: EmptyStateAction;
  /** Visual density — sm for inline lists, md for sections, lg for full-page */
  size?: EmptyStateSize;
  /** Custom class on the wrapper */
  className?: string;
  /** Custom class on the icon circle */
  iconClassName?: string;
  /** Named SVG illustration to render instead of plain icon box */
  illustration?: EmptyStateIllustration;
}

const sizeConfig: Record<EmptyStateSize, {
  wrapper: string;
  iconBox: string;
  iconSize: string;
  title: string;
  description: string;
}> = {
  sm: {
    wrapper: "py-6 px-4",
    iconBox: "h-10 w-10 rounded-xl",
    iconSize: "h-[18px] w-[18px]",
    title: "text-sm font-semibold",
    description: "text-xs max-w-[220px]",
  },
  md: {
    wrapper: "py-12 px-6",
    iconBox: "h-14 w-14 rounded-2xl",
    iconSize: "h-6 w-6",
    title: "text-base font-bold",
    description: "text-sm max-w-[280px]",
  },
  lg: {
    wrapper: "py-20 px-6",
    iconBox: "h-16 w-16 rounded-2xl",
    iconSize: "h-7 w-7",
    title: "text-lg font-bold",
    description: "text-sm max-w-xs",
  },
};

/* ─── SVG Illustrations ─── */

const CalendarIllustration = () => (
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <circle cx="48" cy="48" r="42" fill="#00D4AA" fillOpacity="0.07" />
    <circle cx="48" cy="48" r="36" stroke="#00D4AA" strokeWidth="1.5" strokeDasharray="2 6" strokeOpacity="0.2" />
    {/* Calendar body */}
    <rect x="16" y="22" width="64" height="54" rx="12" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1.5" />
    {/* Header bar */}
    <rect x="16" y="22" width="64" height="20" rx="12" fill="#00D4AA" fillOpacity="0.15" />
    <rect x="16" y="32" width="64" height="10" fill="#00D4AA" fillOpacity="0.15" />
    {/* Month label */}
    <rect x="36" y="28" width="24" height="4" rx="2" fill="#00D4AA" fillOpacity="0.55" />
    {/* Binding pins */}
    <rect x="30" y="14" width="5" height="12" rx="2.5" fill="#00D4AA" fillOpacity="0.65" />
    <rect x="61" y="14" width="5" height="12" rx="2.5" fill="#00D4AA" fillOpacity="0.65" />
    {/* Grid row 1 */}
    <rect x="22" y="48" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.1" />
    <rect x="36" y="48" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.1" />
    <rect x="50" y="48" width="10" height="8" rx="3" fill="#00D4AA" fillOpacity="0.25" />
    <rect x="64" y="48" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.1" />
    {/* Grid row 2 */}
    <rect x="22" y="60" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.07" />
    <rect x="36" y="60" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.07" />
    <rect x="50" y="60" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.07" />
    <rect x="64" y="60" width="10" height="8" rx="3" fill="currentColor" fillOpacity="0.07" />
    {/* Sparkle */}
    <path d="M84 8 L85.7 12.8 L90.5 14.5 L85.7 16.2 L84 21 L82.3 16.2 L77.5 14.5 L82.3 12.8 Z" fill="#FF6B2C" fillOpacity="0.75" />
    <circle cx="12" cy="80" r="3" fill="#00D4AA" fillOpacity="0.35" />
  </svg>
);

const MessagesIllustration = () => (
  <svg width="96" height="88" viewBox="0 0 96 88" fill="none" aria-hidden="true">
    <ellipse cx="48" cy="44" rx="44" ry="40" fill="#00D4AA" fillOpacity="0.07" />
    {/* Left bubble */}
    <rect x="8" y="8" width="56" height="34" rx="16" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
    <path d="M14 42 L8 52 L22 42 Z" fill="currentColor" fillOpacity="0.07" />
    {/* Typing dots */}
    <circle cx="26" cy="25" r="3.5" fill="currentColor" fillOpacity="0.18" />
    <circle cx="38" cy="25" r="3.5" fill="currentColor" fillOpacity="0.18" />
    <circle cx="50" cy="25" r="3.5" fill="currentColor" fillOpacity="0.18" />
    {/* Right bubble (teal) */}
    <rect x="32" y="46" width="56" height="32" rx="14" fill="#00D4AA" fillOpacity="0.14" />
    <path d="M80 78 L88 86 L74 78 Z" fill="#00D4AA" fillOpacity="0.14" />
    {/* Lines in right bubble */}
    <rect x="42" y="56" width="32" height="3.5" rx="1.75" fill="#00D4AA" fillOpacity="0.5" />
    <rect x="42" y="63" width="22" height="3" rx="1.5" fill="#00D4AA" fillOpacity="0.35" />
    {/* Sparkle */}
    <path d="M90 6 L91.3 10 L95.5 11 L91.3 12 L90 16 L88.7 12 L84.5 11 L88.7 10 Z" fill="#FF6B2C" fillOpacity="0.75" />
    <circle cx="6" cy="70" r="2.5" fill="#00D4AA" fillOpacity="0.4" />
  </svg>
);

const NotificationsIllustration = () => (
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <circle cx="48" cy="48" r="42" fill="#00D4AA" fillOpacity="0.07" />
    {/* Wave arcs */}
    <path d="M27 38 Q20 48 27 58" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.28" fill="none" />
    <path d="M19 31 Q10 48 19 65" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.15" fill="none" />
    <path d="M69 38 Q76 48 69 58" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.28" fill="none" />
    <path d="M77 31 Q86 48 77 65" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.15" fill="none" />
    {/* Bell body */}
    <path d="M48 16 C40 16 31 24 31 40 L28 63 L68 63 L65 40 C65 24 56 16 48 16 Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
    {/* Bell top knob */}
    <circle cx="48" cy="14" r="5" fill="#00D4AA" fillOpacity="0.55" />
    {/* Bell clapper */}
    <rect x="41" y="61" width="14" height="7" rx="3.5" fill="currentColor" fillOpacity="0.14" />
    {/* Bell highlight */}
    <path d="M37 36 Q37 29 43 27" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" fill="none" />
    {/* Unread dot (orange) */}
    <circle cx="64" cy="22" r="7" fill="#FF6B2C" fillOpacity="0.2" />
    <circle cx="64" cy="22" r="5" fill="#FF6B2C" fillOpacity="0.85" />
    <circle cx="62" cy="20" r="1.5" fill="white" fillOpacity="0.5" />
    {/* Silent line */}
    <path d="M34 70 L62 70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.1" />
  </svg>
);

const SavedIllustration = () => (
  <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <circle cx="48" cy="48" r="42" fill="#00D4AA" fillOpacity="0.07" />
    {/* Card 1 (back-left) */}
    <rect x="10" y="30" width="44" height="54" rx="10" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
    {/* Card 2 (front-right) */}
    <rect x="34" y="18" width="50" height="64" rx="12" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.09" strokeWidth="1" />
    {/* Thumbnail */}
    <rect x="38" y="22" width="42" height="28" rx="8" fill="#00D4AA" fillOpacity="0.12" />
    {/* Play triangle */}
    <path d="M55 32 L55 42 L63 37 Z" fill="#00D4AA" fillOpacity="0.6" />
    {/* Text lines */}
    <rect x="38" y="55" width="34" height="4" rx="2" fill="currentColor" fillOpacity="0.14" />
    <rect x="38" y="63" width="24" height="3.5" rx="1.75" fill="currentColor" fillOpacity="0.09" />
    {/* Bookmark (teal) */}
    <path d="M70 14 L70 29 L76.5 24 L83 29 L83 14 Z" fill="#00D4AA" fillOpacity="0.8" />
    {/* Small bookmark on back card */}
    <path d="M14 22 L14 34 L19.5 29 L25 34 L25 22 Z" fill="currentColor" fillOpacity="0.1" />
    {/* Star */}
    <path d="M20 66 L21.5 70 L25.5 70 L22.3 72.3 L23.5 76.5 L20 74 L16.5 76.5 L17.7 72.3 L14.5 70 L18.5 70 Z" fill="#FF6B2C" fillOpacity="0.6" />
    {/* Sparkle */}
    <path d="M88 50 L89 53 L92 53.5 L89 54 L88 57 L87 54 L84 53.5 L87 53 Z" fill="#00D4AA" fillOpacity="0.5" />
  </svg>
);

const RequestsIllustration = () => (
  <svg width="96" height="90" viewBox="0 0 96 90" fill="none" aria-hidden="true">
    <ellipse cx="48" cy="45" rx="44" ry="42" fill="#00D4AA" fillOpacity="0.07" />
    {/* Avatar */}
    <circle cx="32" cy="28" r="17" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
    <circle cx="32" cy="24" r="7" fill="currentColor" fillOpacity="0.12" />
    <path d="M18 46 Q22 37 32 37 Q42 37 46 46" fill="currentColor" fillOpacity="0.08" />
    {/* Calendar */}
    <rect x="52" y="10" width="38" height="44" rx="10" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
    <rect x="52" y="10" width="38" height="14" rx="10" fill="#00D4AA" fillOpacity="0.13" />
    <rect x="52" y="17" width="38" height="7" fill="#00D4AA" fillOpacity="0.13" />
    <rect x="58" y="30" width="10" height="8" rx="2.5" fill="currentColor" fillOpacity="0.1" />
    <rect x="72" y="30" width="10" height="8" rx="2.5" fill="#00D4AA" fillOpacity="0.22" />
    <rect x="58" y="42" width="10" height="7" rx="2.5" fill="currentColor" fillOpacity="0.07" />
    <rect x="72" y="42" width="10" height="7" rx="2.5" fill="currentColor" fillOpacity="0.07" />
    {/* Accept button */}
    <rect x="10" y="60" width="76" height="22" rx="10" fill="#00D4AA" fillOpacity="0.14" stroke="#00D4AA" strokeWidth="1" strokeOpacity="0.3" />
    <path d="M44 68 L48 74 L54 65" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Sparkle */}
    <path d="M88 6 L89.2 10 L93 11 L89.2 12 L88 16 L86.8 12 L83 11 L86.8 10 Z" fill="#FF6B2C" fillOpacity="0.7" />
  </svg>
);

const ILLUSTRATIONS: Record<EmptyStateIllustration, React.ComponentType> = {
  calendar: CalendarIllustration,
  messages: MessagesIllustration,
  notifications: NotificationsIllustration,
  saved: SavedIllustration,
  requests: RequestsIllustration,
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  iconClassName,
  illustration,
}: EmptyStateProps) {
  const cfg = sizeConfig[size];
  const IllustrationComp = illustration ? ILLUSTRATIONS[illustration] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        cfg.wrapper,
        className
      )}
    >
      {/* Illustration or icon */}
      {IllustrationComp ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-4 text-foreground"
        >
          <IllustrationComp />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mb-4"
        >
          {size !== "sm" && (
            <div className="absolute inset-0 rounded-full scale-[2] bg-primary/10 blur-xl opacity-60" />
          )}
          <div
            className={cn(
              "relative flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5",
              cfg.iconBox,
              iconClassName
            )}
          >
            <Icon className={cn("text-primary/60", cfg.iconSize)} />
          </div>
        </motion.div>
      )}

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <h3 className={cn("text-foreground mb-1", cfg.title)}>{title}</h3>
        {description && (
          <p className={cn("text-muted-foreground/60 leading-relaxed", description ? "mb-5" : "", cfg.description)}>
            {description}
          </p>
        )}
      </motion.div>

      {/* CTAs */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-2.5"
        >
          {action?.to && (
            <Link
              to={action.to}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,212,170,0.2)]"
            >
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {action?.onClick && !action.to && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              className="rounded-full"
            >
              {action.label}
            </Button>
          )}

          {secondaryAction?.to && (
            <Link
              to={secondaryAction.to}
              className="text-xs text-muted-foreground/50 font-medium active:opacity-70 transition-opacity"
            >
              {secondaryAction.label}
            </Link>
          )}

          {secondaryAction?.onClick && !secondaryAction.to && (
            <button
              onClick={secondaryAction.onClick}
              className="text-xs text-muted-foreground/50 font-medium active:opacity-70 transition-opacity"
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
