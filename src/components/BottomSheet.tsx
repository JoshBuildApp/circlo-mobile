import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Snap points as fractions of viewport height (e.g. [0.5, 0.92]) */
  snapPoints?: (number | string)[];
  /** Title shown in the sticky header */
  title?: string;
  /** Subtitle / secondary text below the title */
  subtitle?: string;
  /** Show close button in header */
  showClose?: boolean;
  /** Sticky footer content (e.g. CTA button) */
  footer?: React.ReactNode;
  /** Extra classes on the content container */
  className?: string;
  children: React.ReactNode;
}

const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints,
  title,
  subtitle,
  showClose = true,
  footer,
  className,
  children,
}: BottomSheetProps) {
  const [snap, setSnap] = React.useState<number | string | null>(
    snapPoints ? snapPoints[0] : null
  );

  const hasHeader = title || subtitle || showClose;

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        {/* Overlay */}
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

        {/* Content */}
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[96dvh] flex-col",
            "rounded-t-2xl border-t border-border/40 bg-background shadow-2xl",
            "focus:outline-none",
            className
          )}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          {hasHeader && (
            <div className="flex items-start gap-3 px-5 pb-3 pt-1">
              <div className="min-w-0 flex-1">
                {title && (
                  <DrawerPrimitive.Title className="truncate text-lg font-semibold leading-tight tracking-tight text-foreground">
                    {title}
                  </DrawerPrimitive.Title>
                )}
                {subtitle && (
                  <DrawerPrimitive.Description className="mt-0.5 truncate text-sm text-muted-foreground">
                    {subtitle}
                  </DrawerPrimitive.Description>
                )}
              </div>

              {showClose && (
                <DrawerPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerPrimitive.Close>
              )}
            </div>
          )}

          {/* Divider */}
          {hasHeader && <div className="mx-5 h-px bg-border/50" />}

          {/* Scrollable body */}
          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain px-5 py-4",
              // When snapped to a small point, disable scroll so drag works
              snapPoints && snap !== snapPoints[snapPoints.length - 1]
                ? "overflow-hidden"
                : "overflow-y-auto"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key="bottom-sheet-content"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sticky footer */}
          {footer && (
            <div className="border-t border-border/50 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export default BottomSheet;
