import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  icon,
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-12 px-6",
        className
      )}
    >
      <div className={cn(
        "rounded-2xl bg-destructive/10 flex items-center justify-center mb-4",
        compact ? "h-12 w-12" : "h-16 w-16"
      )}>
        {icon || <WifiOff className={cn("text-destructive/70", compact ? "h-5 w-5" : "h-7 w-7")} />}
      </div>
      <h3 className={cn(
        "font-semibold text-foreground mb-1.5",
        compact ? "text-sm" : "text-lg"
      )}>
        {title}
      </h3>
      <p className={cn(
        "text-muted-foreground max-w-xs leading-relaxed mb-5",
        compact ? "text-xs" : "text-sm"
      )}>
        {description}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size={compact ? "sm" : "default"}
          className="gap-2 rounded-xl border-border/40 hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  );
}
