import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Challenge {
  id: string
  title: string
  description: string | null
  coach_id: string
  duration_days: number
  created_at: string
  participants_count?: number
  user_joined?: boolean
  user_progress?: number
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('challenges')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setChallenges((data || []).map((d: any) => ({
          ...d,
          participants_count: 0,
          user_joined: false,
          user_progress: 0,
        })))
      } catch (err) {
        console.error('Error fetching challenges:', err)
        setError('Failed to load challenges')
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [])

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('challenge_participants').insert({
        challenge_id: challengeId,
        user_id: user.id,
      })
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to join challenge' }
    }
  }

  const leaveChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('challenge_participants').delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to leave challenge' }
    }
  }

  const updateProgress = async (challengeId: string, progress: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('challenge_participants')
        .update({ progress })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to update progress' }
    }
  }

  return { challenges, loading, error, joinChallenge, leaveChallenge, updateProgress }
}