import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_name: string
  author_avatar_url: string | null
  author_role: string | null
  category: string
  tags: string[]
  is_published: boolean
  published_at: string | null
  updated_at: string
  created_at: string
  meta_title: string | null
  meta_description: string | null
  view_count: number
  read_time_minutes: number
}

const LIST_COLUMNS =
  'id, slug, title, excerpt, cover_image_url, author_name, author_avatar_url, author_role, category, tags, published_at, updated_at, view_count, read_time_minutes, meta_title, meta_description'

export function useBlogPosts(category?: string) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('blog_posts')
        .select(LIST_COLUMNS)
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: fetchError } = await query

      if (cancelled) return

      if (fetchError) {
        console.error('[useBlogPosts] fetch error:', fetchError)
        setError('Failed to load posts')
      } else {
        setPosts((data as BlogPost[]) ?? [])
      }
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [category])

  return { posts, loading, error }
}

export function useBlogPost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (cancelled) return

      if (fetchError) {
        console.error('[useBlogPost] fetch error:', fetchError)
        setError('Post not found')
        setPost(null)
      } else {
        setPost(data as BlogPost)
        // Fire-and-forget view count increment
        supabase.rpc('increment_blog_views', { post_slug: slug }).then()
      }
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [slug])

  return { post, loading, error }
}

/** Return distinct categories from a list of posts */
export function getBlogCategories(posts: BlogPost[]): string[] {
  const seen = new Set<string>()
  const cats: string[] = []
  for (const p of posts) {
    if (!seen.has(p.category)) {
      seen.add(p.category)
      cats.push(p.category)
    }
  }
  return cats
}
