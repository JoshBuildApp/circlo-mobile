import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { useGatewayHealth } from '@/hooks/use-gateway-health';
import { cn } from '@/lib/utils';

interface GatewayHealthStatusProps {
  gatewayUrl?: string;
  compact?: boolean;
}

export function GatewayHealthStatus({ gatewayUrl, compact = false }: GatewayHealthStatusProps) {
  const { data: health, isLoading, error } = useGatewayHealth({ gatewayUrl });

  if (isLoading) {
    return (
      <Card className={cn(compact && "p-2")}>
        <CardHeader className={cn(compact && "pb-2")}>
          <CardTitle className={cn("flex items-center gap-2", compact && "text-sm")}>
            <Skeleton className="h-4 w-4 rounded-full" />
            Gateway Status
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && "pt-0")}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card className={cn(compact && "p-2")}>
        <CardHeader className={cn(compact && "pb-2")}>
          <CardTitle className={cn("flex items-center gap-2 text-destructive", compact && "text-sm")}>
            <XCircle className="h-4 w-4" />
            Gateway Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && "pt-0")}>
          <p className={cn("text-muted-foreground", compact && "text-xs")}>
            Unable to connect to gateway
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant="outline" className={cn("text-xs", getStatusColor())}>
          {health.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Gateway Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant="outline" className={getStatusColor()}>
              {health.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Version</p>
            <p className="text-sm text-muted-foreground">{health.version}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Services</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              {health.services.database === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Database</span>
            </div>
            <div className="flex items-center gap-2">
              {health.services.auth === 'available' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Auth</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</p>
          <p>Last check: {new Date(health.timestamp).toLocaleTimeString()}</p>
          {health.tunnelId && <p>Tunnel ID: {health.tunnelId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}