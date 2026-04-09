import { useState, useCallback } from 'react';

export interface SystemMetric {
  id: string;
  metric_name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  response_time: number;
  error_rate: number;
  active_users: number;
  last_updated: string;
}

export function useSystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const collectMetric = useCallback(async (metricName: string, value: number, metadata?: Record<string, any>) => {
    const metric: SystemMetric = {
      id: crypto.randomUUID(),
      metric_name: metricName,
      value,
      timestamp: new Date().toISOString(),
      metadata,
    };
    setMetrics(prev => [...prev.slice(-99), metric]);
  }, []);

  const startCollecting = useCallback(() => setIsCollecting(true), []);
  const stopCollecting = useCallback(() => setIsCollecting(false), []);

  const getHealth = useCallback((): SystemHealth => {
    return health || {
      status: 'healthy',
      uptime: 100,
      response_time: 0,
      error_rate: 0,
      active_users: 0,
      last_updated: new Date().toISOString(),
    };
  }, [health]);

  return { metrics, health, isCollecting, collectMetric, startCollecting, stopCollecting, getHealth };
}
