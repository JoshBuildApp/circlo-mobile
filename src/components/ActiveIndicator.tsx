import { cn } from "@/lib/utils"

interface ActiveIndicatorProps {
  isActive?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export const ActiveIndicator = ({ 
  isActive = false, 
  size = "sm",
  className 
}: ActiveIndicatorProps) => {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3", 
    lg: "h-4 w-4"
  }

  return (
    <div 
      className={cn(
        "rounded-full border-2 border-card",
        sizeClasses[size],
        isActive ? "bg-accent" : "bg-muted",
        className
      )}
    />
  )
}
