import { useState, useCallback } from 'react';

export interface Issue {
  id: string;
  type: 'booking_failed' | 'payment_error' | 'loading_timeout' | 'auth_error' | 'data_sync_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  user_id: string;
  metadata: Record<string, any>;
  diagnostic_data: Record<string, any>;
  created_at: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface IssueDetectionConfig {
  loadingTimeout: number;
  retryThreshold: number;
  errorThreshold: number;
}

const DEFAULT_CONFIG: IssueDetectionConfig = {
  loadingTimeout: 30000,
  retryThreshold: 3,
  errorThreshold: 5,
};

export function useIssueDetection(config: Partial<IssueDetectionConfig> = {}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectionConfig] = useState({ ...DEFAULT_CONFIG, ...config });
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});

  const reportIssue = useCallback((issue: Omit<Issue, 'id' | 'created_at' | 'status'>) => {
    const newIssue: Issue = {
      ...issue,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: 'open',
    };
    setIssues(prev => [...prev, newIssue]);
    console.warn('[IssueDetection]', newIssue.title, newIssue.description);
  }, []);

  const trackError = useCallback((errorType: string) => {
    setErrorCounts(prev => {
      const newCount = (prev[errorType] || 0) + 1;
      if (newCount >= detectionConfig.errorThreshold) {
        reportIssue({
          type: 'data_sync_error',
          severity: 'high',
          title: `Repeated ${errorType} errors`,
          description: `${errorType} has occurred ${newCount} times`,
          user_id: '',
          metadata: { errorType, count: newCount },
          diagnostic_data: {},
        });
      }
      return { ...prev, [errorType]: newCount };
    });
  }, [detectionConfig.errorThreshold, reportIssue]);

  const startMonitoring = useCallback(() => setIsMonitoring(true), []);
  const stopMonitoring = useCallback(() => setIsMonitoring(false), []);

  return {
    issues,
    isMonitoring,
    reportIssue,
    trackError,
    startMonitoring,
    stopMonitoring,
    detectionConfig,
  };
}
