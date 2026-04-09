import { useState, useCallback, useRef } from 'react';
import { useNotificationBatching } from './use-notification-batching';

interface QueuedNotification {
  id: string;
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'booking' | 'message';
  targetType: 'video' | 'post' | 'user' | 'session';
  targetId: string;
  targetTitle?: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  timestamp: number;
}

export const useNotificationQueue = () => {
  const [queue, setQueue] = useState<QueuedNotification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { batchNotification } = useNotificationBatching();
  const processingTimer = useRef<NodeJS.Timeout>();

  const addToQueue = useCallback((notification: Omit<QueuedNotification, 'id' | 'timestamp'>) => {
    const queuedNotification: QueuedNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    setQueue(prev => [...prev, queuedNotification]);

    // Clear existing timer and set a new one
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
    }

    // Process queue after 30 seconds of inactivity
    processingTimer.current = setTimeout(() => {
      processQueue();
    }, 30000);
  }, []);

  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);

    try {
      // Group notifications by recipient, type, and target
      const groupedNotifications = queue.reduce((acc, notification) => {
        const key = `${notification.recipientId}-${notification.type}-${notification.targetId}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(notification);
        return acc;
      }, {} as Record<string, QueuedNotification[]>);

      // Process each group
      for (const group of Object.values(groupedNotifications)) {
        if (group.length > 0) {
          const representative = group[0];
          
          // For batched notifications, use the most recent actor
          const latestNotification = group.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
          );

          await batchNotification({
            recipientId: representative.recipientId,
            type: representative.type,
            targetType: representative.targetType,
            targetId: representative.targetId,
            targetTitle: representative.targetTitle,
            actorId: latestNotification.actorId,
            actorName: latestNotification.actorName,
            actorAvatar: latestNotification.actorAvatar
          });
        }
      }

      // Clear the queue
      setQueue([]);
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [queue, isProcessing, batchNotification]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    if (processingTimer.current) {
      clearTimeout(processingTimer.current);
    }
  }, []);

  return {
    addToQueue,
    processQueue,
    clearQueue,
    queueSize: queue.length,
    isProcessing
  };
};