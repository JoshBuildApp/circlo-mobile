import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSystemMonitoring } from '@/hooks/use-system-monitoring';
import { useIssueDetection } from '@/hooks/use-issue-detection';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users,
  Zap,
  Wifi,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemHealthDashboard() {
  const { health, collectMetric } = useSystemMonitoring();
  const { issues } = useIssueDetection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const recentIssues = issues
    .filter(issue => issue.status === 'open')
    .slice(0, 5);

  const criticalIssues = issues.filter(issue => issue.severity === 'critical' && issue.status === 'open');

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Health</h2>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {criticalIssues.length} critical issue{criticalIssues.length > 1 ? 's' : ''} detected. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              {health ? getStatusIcon(health.status) : <Activity className="h-5 w-5 text-gray-400" />}
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <div className="flex items-center space-x-2">
                  <Badge className={cn("capitalize", health ? getStatusColor(health.status) : "bg-gray-100")}>
                    {health?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">
                  {health?.response_time ? `${health.response_time}ms` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold">
                  {health?.uptime ? `${(health.uptime * 100).toFixed(2)}%` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {health?.active_users || '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="issues">Recent Issues</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Issues</CardTitle>
              <CardDescription>
                Latest detected issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentIssues.length > 0 ? (
                <div className="space-y-4">
                  {recentIssues.map((issue) => (
                    <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' :
                            issue.severity === 'high' ? 'default' :
                            'secondary'
                          }>
                            {issue.severity}
                          </Badge>
                          <span className="text-sm text-gray-500 capitalize">
                            {issue.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-medium">{issue.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {issue.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(issue.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No recent issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Error Rate</p>
                    <p className="text-2xl font-bold">
                      {health?.error_rate ? `${(health.error_rate * 100).toFixed(2)}%` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Network Quality</p>
                    <p className="text-2xl font-bold">
                      {(navigator as any).connection?.effectiveType || 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-4">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold">
                      {(performance as any).memory ? 
                        `${Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100)}%` : 
                        '--'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                System performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Page Load Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">First Contentful Paint</span>
                      <span className="text-sm font-medium">
                        {performance.getEntriesByName('first-contentful-paint')[0]?.startTime.toFixed(0) || '--'}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Largest Contentful Paint</span>
                      <span className="text-sm font-medium">
                        {performance.getEntriesByName('largest-contentful-paint')[0]?.startTime.toFixed(0) || '--'}ms
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Resource Usage</h4>
                  <div className="space-y-2">
                    {(performance as any).memory && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Heap Used</span>
                          <span className="text-sm font-medium">
                            {((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Heap Total</span>
                          <span className="text-sm font-medium">
                            {((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}