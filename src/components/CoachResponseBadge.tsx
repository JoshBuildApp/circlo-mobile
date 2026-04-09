import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCoachResponseMetrics, formatResponseTime, getResponseTimeLabel } from "@/hooks/use-coach-response-metrics";
import { cn } from "@/lib/utils";

interface CoachResponseBadgeProps {
  coachId: string;
  variant?: "default" | "detailed";
  className?: string;
}

export const CoachResponseBadge = ({ 
  coachId, 
  variant = "default",
  className 
}: CoachResponseBadgeProps) => {
  const { data: metrics, isLoading } = useCoachResponseMetrics(coachId);

  if (isLoading || !metrics) {
    return null;
  }

  const { avg_response_time_minutes, response_rate_percentage } = metrics;
  
  // Only show if coach has decent response metrics
  if (!avg_response_time_minutes || (response_rate_percentage && response_rate_percentage < 70)) {
    return null;
  }

  const responseLabel = getResponseTimeLabel(avg_response_time_minutes);
  const responseTime = formatResponseTime(avg_response_time_minutes);

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">{responseLabel}</span>
        </div>
        <div className="text-xs text-gray-600">
          Average response time: {responseTime}
          {response_rate_percentage && (
            <span className="block">Response rate: {response_rate_percentage.toFixed(0)}%</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
        className
      )}
    >
      <Clock className="h-3 w-3 mr-1" />
      {responseLabel}
    </Badge>
  );
};