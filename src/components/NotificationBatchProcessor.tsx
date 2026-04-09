import { useEffect } from 'react';
import { useNotificationBatching } from '@/hooks/use-notification-batching';

export const NotificationBatchProcessor = () => {
  const { processPendingBatches } = useNotificationBatching();

  useEffect(() => {
    // Process pending batches on component mount
    processPendingBatches();

    // Set up interval to process batches every 5 minutes
    const interval = setInterval(() => {
      processPendingBatches();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [processPendingBatches]);

  return null; // This is a background processing component
};