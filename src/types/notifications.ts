export interface NotificationBatch {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'booking' | 'message';
  target_type: 'video' | 'post' | 'user' | 'session';
  target_id: string;
  target_title?: string;
  actors: NotificationActor[];
  created_at: string;
  updated_at: string;
}

export interface NotificationActor {
  id: string;
  name: string;
  avatar?: string;
}

export interface BatchedNotification {
  id: string;
  user_id: string;
  batch: NotificationBatch;
  is_read: boolean;
  created_at: string;
}

export interface NotificationDigest {
  user_id: string;
  batches: NotificationBatch[];
  total_count: number;
  period: 'hourly' | 'daily';
  created_at: string;
}