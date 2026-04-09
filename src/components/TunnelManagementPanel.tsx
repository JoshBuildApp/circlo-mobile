import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Globe, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TunnelUrlValidator } from './TunnelUrlValidator';
import { GatewayHealthStatus } from './GatewayHealthStatus';
import { useTunnelManagement } from '@/hooks/use-tunnel-management';
import { cn } from '@/lib/utils';

export function TunnelManagementPanel() {
  const {
    tunnels,
    activeTunnel,
    isLoading,
    addTunnel,
    switchTunnel,
    isAddingTunnel,
    isSwitchingTunnel,
  } = useTunnelManagement();

  const handleAddTunnel = (url: string) => {
    addTunnel(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Gateway Status */}
      {activeTunnel && (
        <GatewayHealthStatus gatewayUrl={activeTunnel.url} />
      )}

      {/* Add New Tunnel */}
      <TunnelUrlValidator
        onValidUrl={handleAddTunnel}
        currentUrl={activeTunnel?.url}
      />

      {/* Tunnel List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Tunnel URLs ({tunnels?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!tunnels?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tunnel URLs configured</p>
              <p className="text-sm">Add your first tunnel URL above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tunnels.map((tunnel) => (
                <div
                  key={tunnel.id}
                  className={cn(
                    "p-4 border rounded-lg transition-colors",
                    tunnel.is_active && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getStatusColor(tunnel.health_status)}>
                          {tunnel.health_status}
                        </Badge>
                        {tunnel.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <p className="font-mono text-sm truncate">{tunnel.url}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(tunnel.created_at).toLocaleDateString()}
                        {tunnel.last_health_check && (
                          <> • Last check: {new Date(tunnel.last_health_check).toLocaleTimeString()}</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!tunnel.is_active && (
                        <Button
                          size="sm"
                          onClick={() => switchTunnel(tunnel.id)}
                          disabled={isSwitchingTunnel}
                        >
                          Switch
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            disabled={tunnel.is_active}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {tunnel.health_status === 'unhealthy' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">This tunnel is not responding to health checks</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}