import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationActor {
  id: string;
  name: string;
  avatar?: string;
}

export const useNotificationBatching = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const batchNotification = useCallback(async ({
    recipientId,
    type,
    targetType,
    targetId,
    actorName,
  }: {
    recipientId: string;
    type: 'like' | 'comment' | 'follow' | 'booking' | 'message';
    targetType: 'video' | 'post' | 'user' | 'session';
    targetId: string;
    targetTitle?: string;
    actorId: string;
    actorName: string;
    actorAvatar?: string;
  }) => {
    try {
      setIsProcessing(true);
      // Create a simple notification instead of batching (no notification_batches table)
      await supabase.rpc('create_notification', {
        _user_id: recipientId,
        _type: type,
        _title: `New ${type}`,
        _body: `${actorName} ${getActionText(type)} your ${targetType}`,
        _reference_id: targetId,
        _reference_type: targetType,
      });
      return { success: true };
    } catch (error) {
      console.error('Error batching notification:', error);
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processPendingBatches = useCallback(async () => {
    return { success: true };
  }, []);

  const getActionText = (type: string): string => {
    switch (type) {
      case 'like': return 'liked';
      case 'comment': return 'commented on';
      case 'follow': return 'started following';
      case 'booking': return 'booked';
      case 'message': return 'sent you a message';
      default: return 'interacted with';
    }
  };

  return { batchNotification, processPendingBatches, isProcessing };
};
