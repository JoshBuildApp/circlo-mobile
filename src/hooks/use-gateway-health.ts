import { useQuery } from '@tanstack/react-query';
import { GatewayHealthStatus } from '@/lib/gateway-health';

interface UseGatewayHealthOptions {
  gatewayUrl?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useGatewayHealth(options: UseGatewayHealthOptions = {}) {
  const {
    gatewayUrl = window.location.origin,
    enabled = true,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery({
    queryKey: ['gateway-health', gatewayUrl],
    queryFn: async (): Promise<GatewayHealthStatus> => {
      const response = await fetch(`${gatewayUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return response.json();
    },
    enabled,
    refetchInterval,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useGatewayUrlValidation(url: string) {
  return useQuery({
    queryKey: ['validate-gateway-url', url],
    queryFn: async (): Promise<boolean> => {
      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
          return false;
        }

        const health: GatewayHealthStatus = await response.json();
        return health.status === 'healthy' || health.status === 'degraded';
      } catch {
        return false;
      }
    },
    enabled: !!url && url !== window.location.origin,
    retry: false,
    refetchOnWindowFocus: false,
  });
}