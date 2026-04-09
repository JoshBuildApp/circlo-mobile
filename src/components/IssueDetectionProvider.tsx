import React, { createContext, useContext, ReactNode } from 'react';
import { useIssueDetection } from '@/hooks/use-issue-detection';
import { useSystemMonitoring } from '@/hooks/use-system-monitoring';

interface IssueDetectionContextType {
  reportIssue: (issue: any) => void;
  trackError: (errorType: string) => void;
  collectMetric: (metricName: string, value: number, metadata?: Record<string, any>) => Promise<void>;
  isMonitoring: boolean;
}

const IssueDetectionContext = createContext<IssueDetectionContextType | undefined>(undefined);

export function useIssueDetectionContext() {
  const context = useContext(IssueDetectionContext);
  if (!context) {
    throw new Error('useIssueDetectionContext must be used within IssueDetectionProvider');
  }
  return context;
}

interface IssueDetectionProviderProps {
  children: ReactNode;
}

export function IssueDetectionProvider({ children }: IssueDetectionProviderProps) {
  const { reportIssue, trackError, isMonitoring } = useIssueDetection();
  const { collectMetric } = useSystemMonitoring();

  const contextValue: IssueDetectionContextType = {
    reportIssue,
    trackError,
    collectMetric,
    isMonitoring,
  };

  return (
    <IssueDetectionContext.Provider value={contextValue}>
      {children}
    </IssueDetectionContext.Provider>
  );
}
