import { type ReactNode, forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type RoundButtonVariant = "default" | "ghost" | "solid-navy" | "solid-dark";
type RoundButtonSize = "sm" | "md" | "lg";

interface RoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RoundButtonVariant;
  size?: RoundButtonSize;
  ariaLabel: string;
  children: ReactNode;
}

const sizeMap: Record<RoundButtonSize, string> = {
  sm: "w-9 h-9",
  md: "w-10 h-10",
  lg: "w-11 h-11",
};

const variantMap: Record<RoundButtonVariant, string> = {
  default: "bg-black/50 text-offwhite",
  ghost: "bg-transparent text-offwhite",
  "solid-navy": "bg-navy-card text-offwhite",
  "solid-dark": "bg-navy-card-2 text-offwhite",
};

export const RoundButton = forwardRef<HTMLButtonElement, RoundButtonProps>(
  ({ variant = "default", size = "md", ariaLabel, children, className, ...rest }, ref) => (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        "rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal transition-opacity active:opacity-80",
        sizeMap[size],
        variantMap[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);
RoundButton.displayName = "RoundButton";
