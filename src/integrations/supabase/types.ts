export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_table: string | null
          target_id: string | null
          old_value: Json | null
          new_value: Json | null
          metadata: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_table?: string | null
          target_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_table?: string | null
          target_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      access_requests: {
        Row: {
          access_code: string | null
          created_at: string | null
          description: string
          fingerprint: string | null
          id: string
          name: string
          permission_type: string
          reviewed_at: string | null
          status: string | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          description: string
          fingerprint?: string | null
          id?: string
          name: string
          permission_type: string
          reviewed_at?: string | null
          status?: string | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          description?: string
          fingerprint?: string | null
          id?: string
          name?: string
          permission_type?: string
          reviewed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      agent_activity: {
        Row: {
          agent_id: string | null
          created_at: string
          details: Json | null
          id: string
          summary: string
          task_id: string | null
          type: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          summary: string
          task_id?: string | null
          type: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          summary?: string
          task_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chat: {
        Row: {
          agent_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_costs: {
        Row: {
          agent_id: string | null
          cost_usd: number
          created_at: string | null
          id: string
          input_tokens: number
          model: string | null
          output_tokens: number
          provider: string | null
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cost_usd?: number
          created_at?: string | null
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          provider?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_costs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_costs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ideas: {
        Row: {
          agent_id: string | null
          approved_at: string | null
          created_at: string | null
          description: string | null
          generated_date: string | null
          id: string
          priority: string | null
          status: string | null
          team: string | null
          title: string
        }
        Insert: {
          agent_id?: string | null
          approved_at?: string | null
          created_at?: string | null
          description?: string | null
          generated_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title: string
        }
        Update: {
          agent_id?: string | null
          approved_at?: string | null
          created_at?: string | null
          description?: string | null
          generated_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_ideas_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reports: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          generated_by: string | null
          id: string
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          generated_by?: string | null
          id?: string
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          generated_by?: string | null
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_status: {
        Row: {
          agent_id: string | null
          created_at: string
          details: Json | null
          id: string
          status: string
          type: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          status: string
          type: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_status_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          project: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          project?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          project?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          avatar_url: string | null
          bio: string | null
          commits_count: number | null
          created_at: string | null
          id: string
          mission: string | null
          model: string | null
          name: string
          provider: string | null
          role: string | null
          specialty: string | null
          status: string | null
          system_prompt: string | null
          tasks_completed: number | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          commits_count?: number | null
          created_at?: string | null
          id?: string
          mission?: string | null
          model?: string | null
          name: string
          provider?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
          system_prompt?: string | null
          tasks_completed?: number | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          commits_count?: number | null
          created_at?: string | null
          id?: string
          mission?: string | null
          model?: string | null
          name?: string
          provider?: string | null
          role?: string | null
          specialty?: string | null
          status?: string | null
          system_prompt?: string | null
          tasks_completed?: number | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          allowed_training_types: string[]
          auto_approve: boolean
          coach_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          max_participants: number
          schedule_type: string
          specific_date: string | null
          start_time: string
          template_id: string | null
        }
        Insert: {
          allowed_training_types?: string[]
          auto_approve?: boolean
          coach_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          max_participants?: number
          schedule_type?: string
          specific_date?: string | null
          start_time: string
          template_id?: string | null
        }
        Update: {
          allowed_training_types?: string[]
          auto_approve?: boolean
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          max_participants?: number
          schedule_type?: string
          specific_date?: string | null
          start_time?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          requirement_type?: string
          requirement_value?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          coach_id: string
          created_at: string
          date: string
          id: string
          reason: string | null
          time: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          time: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_participants: {
        Row: {
          booking_id: string
          id: string
          joined_at: string
          payment_status: string
          user_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          joined_at?: string
          payment_status?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          joined_at?: string
          payment_status?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_code: string | null
          coach_id: string
          coach_name: string
          created_at: string
          date: string
          group_invite_code: string | null
          group_status: string
          id: string
          is_group: boolean
          payment_method: string
          platform_fee: number
          price: number
          price_per_person: number | null
          session_id: string | null
          status: string
          time: string
          time_label: string
          total_participants: number
          training_type: string
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          coach_id: string
          coach_name: string
          created_at?: string
          date: string
          group_invite_code?: string | null
          group_status?: string
          id?: string
          is_group?: boolean
          payment_method?: string
          platform_fee?: number
          price: number
          price_per_person?: number | null
          session_id?: string | null
          status?: string
          time: string
          time_label: string
          total_participants?: number
          training_type?: string
          user_id: string
        }
        Update: {
          booking_code?: string | null
          coach_id?: string
          coach_name?: string
          created_at?: string
          date?: string
          group_invite_code?: string | null
          group_status?: string
          id?: string
          is_group?: boolean
          payment_method?: string
          platform_fee?: number
          price?: number
          price_per_person?: number | null
          session_id?: string | null
          status?: string
          time?: string
          time_label?: string
          total_participants?: number
          training_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          title: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          title: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          title?: string
        }
        Relationships: []
      }
      coach_posts: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_fake: boolean
          text: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_fake?: boolean
          text: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_fake?: boolean
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_profiles: {
        Row: {
          achievements: string[] | null
          bio: string | null
          bit_link: string | null
          bit_qr_url: string | null
          boost_expires_at: string | null
          certifications: string[] | null
          coach_name: string
          cover_media: string | null
          created_at: string
          followers: number | null
          id: string
          ideal_for: string | null
          image_url: string | null
          intro_video_url: string | null
          is_boosted: boolean
          is_fake: boolean
          is_pro: boolean
          is_top_creator: boolean
          is_verified: boolean
          languages: string[] | null
          location: string | null
          pay_on_arrival: boolean
          paybox_link: string | null
          payment_phone: string | null
          price: number | null
          rating: number | null
          response_time: string | null
          session_duration: number | null
          specialties: string[] | null
          sport: string
          tagline: string | null
          total_sessions: number | null
          training_style: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          achievements?: string[] | null
          bio?: string | null
          bit_link?: string | null
          bit_qr_url?: string | null
          boost_expires_at?: string | null
          certifications?: string[] | null
          coach_name: string
          cover_media?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          ideal_for?: string | null
          image_url?: string | null
          intro_video_url?: string | null
          is_boosted?: boolean
          is_fake?: boolean
          is_pro?: boolean
          is_top_creator?: boolean
          is_verified?: boolean
          languages?: string[] | null
          location?: string | null
          pay_on_arrival?: boolean
          paybox_link?: string | null
          payment_phone?: string | null
          price?: number | null
          rating?: number | null
          response_time?: string | null
          session_duration?: number | null
          specialties?: string[] | null
          sport: string
          tagline?: string | null
          total_sessions?: number | null
          training_style?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          achievements?: string[] | null
          bio?: string | null
          bit_link?: string | null
          bit_qr_url?: string | null
          boost_expires_at?: string | null
          certifications?: string[] | null
          coach_name?: string
          cover_media?: string | null
          created_at?: string
          followers?: number | null
          id?: string
          ideal_for?: string | null
          image_url?: string | null
          intro_video_url?: string | null
          is_boosted?: boolean
          is_fake?: boolean
          is_pro?: boolean
          is_top_creator?: boolean
          is_verified?: boolean
          languages?: string[] | null
          location?: string | null
          pay_on_arrival?: boolean
          paybox_link?: string | null
          payment_phone?: string | null
          price?: number | null
          rating?: number | null
          response_time?: string | null
          session_duration?: number | null
          specialties?: string[] | null
          sport?: string
          tagline?: string | null
          total_sessions?: number | null
          training_style?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      coach_videos: {
        Row: {
          category: string
          coach_id: string
          comments_count: number
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_exclusive: boolean
          is_fake: boolean
          is_featured: boolean
          likes_count: number
          media_type: string
          media_url: string
          thumbnail_url: string | null
          title: string
          user_id: string
          views: number | null
        }
        Insert: {
          category?: string
          coach_id: string
          comments_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_exclusive?: boolean
          is_fake?: boolean
          is_featured?: boolean
          likes_count?: number
          media_type?: string
          media_url: string
          thumbnail_url?: string | null
          title: string
          user_id: string
          views?: number | null
        }
        Update: {
          category?: string
          coach_id?: string
          comments_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_exclusive?: boolean
          is_fake?: boolean
          is_featured?: boolean
          likes_count?: number
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content_id: string
          created_at: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "coach_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      group_pricing: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          participant_count: number
          price_per_person: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          participant_count: number
          price_per_person: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          participant_count?: number
          price_per_person?: number
        }
        Relationships: []
      }
      highlights: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          media_url: string
          title: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          media_url: string
          title: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          media_url?: string
          title?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "coach_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          coach_id: string
          config: Json | null
          created_at: string
          id: string
          is_visible: boolean
          layout_size: string
          position: number
          section_type: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          config?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          layout_size?: string
          position?: number
          section_type: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          config?: Json | null
          created_at?: string
          id?: string
          is_visible?: boolean
          layout_size?: string
          position?: number
          section_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          coach_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          stock: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          coach_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          status?: string
          stock?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          coach_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          stock?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          interests: string[] | null
          last_active_at: string | null
          show_activity_status: boolean
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          last_active_at?: string | null
          show_activity_status?: boolean
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          last_active_at?: string | null
          show_activity_status?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
          user_name: string | null
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
          user_name?: string | null
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          collection_name: string
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          collection_name?: string
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          collection_name?: string
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          coach_id: string | null
          created_at: string
          expires_at: string
          id: string
          is_fake: boolean
          media_url: string
          user_id: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_fake?: boolean
          media_url: string
          user_id?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_fake?: boolean
          media_url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      task_suggestions: {
        Row: {
          approved_at: string | null
          assigned_agent: string | null
          created_at: string | null
          description: string
          id: string
          model_reason: string | null
          priority: string | null
          project: string | null
          recommended_model: string
          status: string | null
          title: string
        }
        Insert: {
          approved_at?: string | null
          assigned_agent?: string | null
          created_at?: string | null
          description: string
          id?: string
          model_reason?: string | null
          priority?: string | null
          project?: string | null
          recommended_model: string
          status?: string | null
          title: string
        }
        Update: {
          approved_at?: string | null
          assigned_agent?: string | null
          created_at?: string | null
          description?: string
          id?: string
          model_reason?: string | null
          priority?: string | null
          project?: string | null
          recommended_model?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string | null
          priority: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      trainee_progress: {
        Row: {
          created_at: string
          id: string
          last_training_date: string | null
          level: number
          streak_days: number
          total_sessions: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_training_date?: string | null
          level?: number
          streak_days?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_training_date?: string | null
          level?: number
          streak_days?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          coach_id: string
          created_at: string
          current_bookings: number
          date: string
          description: string | null
          id: string
          is_public: boolean
          location: string | null
          max_capacity: number
          price: number | null
          session_type: string
          status: string
          template_id: string | null
          time: string
          time_label: string
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          current_bookings?: number
          date: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          max_capacity?: number
          price?: number | null
          session_type?: string
          status?: string
          template_id?: string | null
          time: string
          time_label?: string
          title?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          current_bookings?: number
          date?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          max_capacity?: number
          price?: number | null
          session_type?: string
          status?: string
          template_id?: string | null
          time?: string
          time_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_templates: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          location: string | null
          max_participants: number
          notes: string | null
          price: number | null
          title: string
          training_type: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number
          notes?: string | null
          price?: number | null
          title: string
          training_type?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          max_participants?: number
          notes?: string | null
          price?: number | null
          title?: string
          training_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_content: {
        Row: {
          content_id: string
          created_at: string
          id: string
          score: number
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          score?: number
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          score?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          certifications_text: string | null
          coach_id: string
          coach_image_url: string | null
          coach_name: string
          created_at: string
          documents_urls: string[]
          experience_text: string
          id: string
          links: string | null
          phone: string | null
          rejection_reason: string | null
          sport: string | null
          status: string
          years_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          certifications_text?: string | null
          coach_id: string
          coach_image_url?: string | null
          coach_name?: string
          created_at?: string
          documents_urls?: string[]
          experience_text?: string
          id?: string
          links?: string | null
          phone?: string | null
          rejection_reason?: string | null
          sport?: string | null
          status?: string
          years_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          certifications_text?: string | null
          coach_id?: string
          coach_image_url?: string | null
          coach_name?: string
          created_at?: string
          documents_urls?: string[]
          experience_text?: string
          id?: string
          links?: string | null
          phone?: string | null
          rejection_reason?: string | null
          sport?: string | null
          status?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watches: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          user_id: string
          video_id: string
          watch_seconds: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          user_id: string
          video_id: string
          watch_seconds?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
          watch_seconds?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string | null
          interests: string[] | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          interests?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          interests?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_admin: { Args: { _target_user_id: string }; Returns: undefined }
      award_training_xp: {
        Args: { _user_id: string; _xp_amount?: number }
        Returns: Json
      }
      create_notification: {
        Args: {
          _body: string
          _reference_id?: string
          _reference_type?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      get_follower_count: { Args: { coach_id_input: string }; Returns: number }
      get_followers: {
        Args: { coach_id_input: string }
        Returns: {
          created_at: string
          user_id: string
        }[]
      }
      get_following: {
        Args: { user_id_input: string }
        Returns: {
          coach_id: string
          created_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_comments: {
        Args: { delta: number; video_id: string }
        Returns: undefined
      }
      increment_likes: {
        Args: { delta: number; video_id: string }
        Returns: undefined
      }
      increment_session_booking: {
        Args: { session_id_input: string }
        Returns: undefined
      }
      increment_views: { Args: { video_id: string }; Returns: undefined }
      log_payment_access: {
        Args: { _coach_profile_id: string }
        Returns: undefined
      }
      write_audit_log: {
        Args: {
          _user_id: string | null
          _action: string
          _target_table?: string | null
          _target_id?: string | null
          _old_value?: Json | null
          _new_value?: Json | null
          _metadata?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "coach" | "developer"
      audit_action:
        | "role_change"
        | "payment_access"
        | "profile_edit"
        | "coach_status_change"
        | "booking_change"
        | "verification_change"
        | "account_delete"
        | "admin_action"
        | "login"
        | "password_reset"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "coach", "developer"],
    },
  },
} as const
