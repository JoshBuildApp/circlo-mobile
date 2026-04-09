import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface CoachPost {
  id: string
  user_id: string
  coach_id: string
  text: string
  content: string
  is_fake: boolean
  created_at: string
}

export const useCoachPosts = (coachId?: string) => {
  const [posts, setPosts] = useState<CoachPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let query = supabase
          .from('coach_posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (coachId) {
          query = query.eq('coach_id', coachId)
        }

        const { data, error: fetchError } = await query
        if (fetchError) throw fetchError
        setPosts((data || []).map((d: any) => ({ ...d, content: d.text })))
      } catch (err) {
        console.error('Error fetching coach posts:', err)
        setError('Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [coachId])

  const createPost = async (postData: {
    content: string
    image_url?: string
    video_url?: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('coach_posts')
        .insert({
          user_id: user.id,
          coach_id: coachId || '',
          text: postData.content,
          is_fake: false,
        })

      if (insertError) throw insertError
      return { success: true }
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post')
      return { success: false, error: 'Failed to create post' }
    }
  }

  return { posts, loading, error, createPost }
}