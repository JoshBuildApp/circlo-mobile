import { supabase } from '@/integrations/supabase/client';

export interface GatewayHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    auth: 'available' | 'unavailable';
  };
}

class GatewayHealthChecker {
  private startTime: number = Date.now();
  private version: string = '1.0.0';

  async checkHealth(): Promise<GatewayHealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      // Check database connectivity
      const dbStatus = await this.checkDatabase();
      
      // Check auth service
      const authStatus = await this.checkAuth();

      const overallStatus = this.determineOverallStatus(dbStatus, authStatus);

      return {
        status: overallStatus,
        version: this.version,
        timestamp,
        uptime,
        services: {
          database: dbStatus,
          auth: authStatus,
        },
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        version: this.version,
        timestamp,
        uptime,
        services: {
          database: 'disconnected',
          auth: 'unavailable',
        },
      };
    }
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return error ? 'disconnected' : 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async checkAuth(): Promise<'available' | 'unavailable'> {
    try {
      const { error } = await supabase.auth.getSession();
      return error ? 'unavailable' : 'available';
    } catch {
      return 'unavailable';
    }
  }

  private determineOverallStatus(
    dbStatus: string,
    authStatus: string
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (dbStatus === 'connected' && authStatus === 'available') {
      return 'healthy';
    }
    
    if (dbStatus === 'connected' || authStatus === 'available') {
      return 'degraded';
    }
    
    return 'unhealthy';
  }
}

export const gatewayHealth = new GatewayHealthChecker();