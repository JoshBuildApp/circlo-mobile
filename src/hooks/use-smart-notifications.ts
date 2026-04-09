import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSmartNotifications = () => {
  const sendNotification = useCallback(async ({
    recipientId,
    type,
    title,
    message,
    targetId,
    targetType,
    actorId,
  }: {
    recipientId: string;
    type: string;
    title: string;
    message: string;
    targetType?: string;
    targetId?: string;
    targetTitle?: string;
    actorId: string;
    actorName: string;
    actorAvatar?: string;
    immediate?: boolean;
  }) => {
    try {
      if (recipientId === actorId) return { success: true };
      await supabase.rpc('create_notification', {
        _user_id: recipientId,
        _type: type,
        _title: title,
        _body: message,
        _reference_id: targetId || null,
        _reference_type: targetType || null,
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  }, []);

  const sendLikeNotification = useCallback(async (
    recipientId: string, actorId: string, actorName: string,
    targetType: 'video' | 'post', targetId: string, _targetTitle?: string, actorAvatar?: string
  ) => sendNotification({ recipientId, type: 'like', title: 'New Like', message: `${actorName} liked your ${targetType}`, targetType, targetId, actorId, actorName, actorAvatar }), [sendNotification]);

  const sendCommentNotification = useCallback(async (
    recipientId: string, actorId: string, actorName: string,
    targetType: 'video' | 'post', targetId: string, _targetTitle?: string, actorAvatar?: string
  ) => sendNotification({ recipientId, type: 'comment', title: 'New Comment', message: `${actorName} commented on your ${targetType}`, targetType, targetId, actorId, actorName, actorAvatar }), [sendNotification]);

  const sendFollowNotification = useCallback(async (recipientId: string, actorId: string, actorName: string, actorAvatar?: string) =>
    sendNotification({ recipientId, type: 'follow', title: 'New Follower', message: `${actorName} started following you`, targetType: 'user', targetId: recipientId, actorId, actorName, actorAvatar }), [sendNotification]);

  const sendBookingNotification = useCallback(async (recipientId: string, actorId: string, actorName: string, _sessionTitle: string, actorAvatar?: string) =>
    sendNotification({ recipientId, type: 'booking', title: 'New Booking', message: `${actorName} booked a session`, actorId, actorName, actorAvatar, immediate: true }), [sendNotification]);

  const sendMessageNotification = useCallback(async (recipientId: string, actorId: string, actorName: string, messagePreview: string, actorAvatar?: string) =>
    sendNotification({ recipientId, type: 'message', title: 'New Message', message: `${actorName}: ${messagePreview}`, actorId, actorName, actorAvatar, immediate: true }), [sendNotification]);

  return { sendNotification, sendLikeNotification, sendCommentNotification, sendFollowNotification, sendBookingNotification, sendMessageNotification };
};
