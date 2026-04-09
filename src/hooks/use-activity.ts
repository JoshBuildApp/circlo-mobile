import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface ActivityData {
  posts: number
  followers: number
  following: number
  sessions: number
}

export const useActivity = (userId?: string) => {
  const [activity, setActivity] = useState<ActivityData>({
    posts: 0,
    followers: 0,
    following: 0,
    sessions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchActivity = async () => {
      try {
        setError(null)
        
        const { count: postsCount } = await supabase
          .from('coach_videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        const { count: followersCount } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        const { count: sessionsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        setActivity({
          posts: postsCount || 0,
          followers: followersCount || 0,
          following: 0,
          sessions: sessionsCount || 0
        })
      } catch (err) {
        console.error('Error fetching activity:', err)
        setError('Failed to load activity data')
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [userId])

  return { activity, loading, error }
}

export type ActivityStatus = "online" | "away" | "offline";

export function getActivityStatus(lastActiveAt: string | null): ActivityStatus {
  if (!lastActiveAt) return "offline";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff < 5 * 60 * 1000) return "online";
  if (diff < 30 * 60 * 1000) return "away";
  return "offline";
}

export function getActivityLabel(status: ActivityStatus): string {
  if (status === "online") return "Online";
  if (status === "away") return "Away";
  return "Offline";
}