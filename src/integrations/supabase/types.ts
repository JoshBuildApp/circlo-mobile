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
      agent_work_log: {
        Row: {
          agent_name: string
          commit_hash: string | null
          completed_at: string | null
          files_changed: number | null
          id: string
          repo: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          work_description: string
        }
        Insert: {
          agent_name: string
          commit_hash?: string | null
          completed_at?: string | null
          files_changed?: number | null
          id?: string
          repo?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          work_description: string
        }
        Update: {
          agent_name?: string
          commit_hash?: string | null
          completed_at?: string | null
          files_changed?: number | null
          id?: string
          repo?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          work_description?: string
        }
        Relationships: []
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
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
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
            foreignKeyName: "availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
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
          {
            foreignKeyName: "blocked_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          author_role: string | null
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time_minutes: number
          slug: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string
          author_role?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          author_role?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      bob_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          source: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          source?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bob_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bob_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          package_id: string | null
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
          waiver_accepted_at: string | null
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
          package_id?: string | null
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
          waiver_accepted_at?: string | null
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
          package_id?: string | null
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
          waiver_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "user_packages"
            referencedColumns: ["id"]
          },
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
      coach_hub_settings: {
        Row: {
          accent_color: string | null
          announcement: string | null
          announcement_active: boolean
          coach_id: string
          cover_style: string
          created_at: string
          figure_url: string | null
          id: string
          layout_style: string
          pinned_items: Json
          tab_order: Json
          theme_preset: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          announcement?: string | null
          announcement_active?: boolean
          coach_id: string
          cover_style?: string
          created_at?: string
          figure_url?: string | null
          id?: string
          layout_style?: string
          pinned_items?: Json
          tab_order?: Json
          theme_preset?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          announcement?: string | null
          announcement_active?: boolean
          coach_id?: string
          cover_style?: string
          created_at?: string
          figure_url?: string | null
          id?: string
          layout_style?: string
          pinned_items?: Json
          tab_order?: Json
          theme_preset?: string
          updated_at?: string
        }
        Relationships: []
      }
      coach_packages: {
        Row: {
          coach_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          session_count: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          coach_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          session_count: number
          updated_at?: string
          validity_days: number
        }
        Update: {
          coach_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          session_count?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coach_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "coach_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["user_id"]
          },
        ]
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
          insurance_doc_url: string | null
          insurance_expiry_date: string | null
          insurance_verified_at: string | null
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
          insurance_doc_url?: string | null
          insurance_expiry_date?: string | null
          insurance_verified_at?: string | null
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
          insurance_doc_url?: string | null
          insurance_expiry_date?: string | null
          insurance_verified_at?: string | null
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
      council_sessions: {
        Row: {
          confidence: string | null
          created_at: string
          decision_note: string | null
          id: string
          messages: Json
          question: string
          reasoning: string | null
          roles: Json
          status: string
          tally: Json
          updated_at: string
          verdict_summary: string | null
          votes: Json
          winner_index: number | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          decision_note?: string | null
          id?: string
          messages?: Json
          question: string
          reasoning?: string | null
          roles: Json
          status?: string
          tally?: Json
          updated_at?: string
          verdict_summary?: string | null
          votes?: Json
          winner_index?: number | null
        }
        Update: {
          confidence?: string | null
          created_at?: string
          decision_note?: string | null
          id?: string
          messages?: Json
          question?: string
          reasoning?: string | null
          roles?: Json
          status?: string
          tally?: Json
          updated_at?: string
          verdict_summary?: string | null
          votes?: Json
          winner_index?: number | null
        }
        Relationships: []
      }
      dev_missions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          priority: string
          progress: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_sequence_enrollments: {
        Row: {
          enrolled_at: string
          id: string
          metadata: Json
          sequence_id: string
          status: string
          user_id: string
        }
        Insert: {
          enrolled_at?: string
          id?: string
          metadata?: Json
          sequence_id: string
          status?: string
          user_id: string
        }
        Update: {
          enrolled_at?: string
          id?: string
          metadata?: Json
          sequence_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_queue: {
        Row: {
          attempts: number
          created_at: string
          enrollment_id: string
          error: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          step_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          enrollment_id: string
          error?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          step_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          enrollment_id?: string
          error?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_queue_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_queue_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          delay_days: number
          description: string | null
          id: string
          sequence_id: string
          step_number: number
          subject: string
          template_key: string
        }
        Insert: {
          delay_days?: number
          description?: string | null
          id?: string
          sequence_id: string
          step_number: number
          subject: string
          template_key: string
        }
        Update: {
          delay_days?: number
          description?: string | null
          id?: string
          sequence_id?: string
          step_number?: number
          subject?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
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
      mat_view_refresh_log: {
        Row: {
          duration_ms: number | null
          id: number
          refreshed_at: string
          triggered_by: string
          view_name: string
        }
        Insert: {
          duration_ms?: number | null
          id?: never
          refreshed_at?: string
          triggered_by?: string
          view_name: string
        }
        Update: {
          duration_ms?: number | null
          id?: never
          refreshed_at?: string
          triggered_by?: string
          view_name?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          cdn_url: string | null
          created_at: string
          duration_seconds: number | null
          entity_id: string | null
          entity_type: string | null
          file_name: string
          file_size: number | null
          file_type: string
          height: number | null
          id: string
          media_category: string
          status: string
          storage_path: string | null
          updated_at: string
          url: string
          user_id: string
          width: number | null
        }
        Insert: {
          cdn_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          height?: number | null
          id?: string
          media_category?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          url: string
          user_id: string
          width?: number | null
        }
        Update: {
          cdn_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          height?: number | null
          id?: string
          media_category?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_01: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_02: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_03: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_04: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_05: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_06: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_07: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_08: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_09: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_10: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_11: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2025_12: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_01: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_02: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_03: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_04: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_05: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_06: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_07: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_08: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_09: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_10: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_11: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2026_12: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_01: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_02: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_03: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_04: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_05: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_2027_06: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages_default: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
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
      partition_health_snapshots: {
        Row: {
          captured_at: string
          default_rows: number
          details: Json
          drift_detected: boolean
          id: string
          partition_count: number
          total_rows: number
          total_size_mb: number
        }
        Insert: {
          captured_at?: string
          default_rows?: number
          details?: Json
          drift_detected?: boolean
          id?: string
          partition_count?: number
          total_rows?: number
          total_size_mb?: number
        }
        Update: {
          captured_at?: string
          default_rows?: number
          details?: Json
          drift_detected?: boolean
          id?: string
          partition_count?: number
          total_rows?: number
          total_size_mb?: number
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          amount_cents: number
          booking_id: string | null
          checkout_url: string | null
          created_at: string
          currency: string
          error_detail: string | null
          grow_ref: string | null
          id: string
          idempotency_key: string
          metadata: Json
          settled_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          booking_id?: string | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          error_detail?: string | null
          grow_ref?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          error_detail?: string | null
          grow_ref?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          settled_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_min: number
          id: string
          notes: string | null
          plan_subscription_id: string | null
          plan_workout_id: string | null
          starts_at: string
          title: string
          user_id: string
          workout_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_min: number
          id?: string
          notes?: string | null
          plan_subscription_id?: string | null
          plan_workout_id?: string | null
          starts_at: string
          title: string
          user_id: string
          workout_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          plan_subscription_id?: string | null
          plan_workout_id?: string | null
          starts_at?: string
          title?: string
          user_id?: string
          workout_type?: string
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
          {
            foreignKeyName: "products_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      profile_views: {
        Row: {
          coach_profile_id: string
          id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          coach_profile_id: string
          id?: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          coach_profile_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: []
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
      push_campaigns: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          segment_roles: string[]
          segment_sports: string[]
          sent_count: number
          status: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          segment_roles?: string[]
          segment_sports?: string[]
          sent_count?: number
          status?: string
          title: string
          updated_at?: string
          url?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          segment_roles?: string[]
          segment_sports?: string[]
          sent_count?: number
          status?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
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
          {
            foreignKeyName: "reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          phase_id: string | null
          roadmap_type: string
          status: string
          target: string
          title: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phase_id?: string | null
          roadmap_type?: string
          status?: string
          target?: string
          title: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phase_id?: string | null
          roadmap_type?: string
          status?: string
          target?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "roadmap_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_phases: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          phase_number: number
          roadmap_type: string
          started_at: string | null
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phase_number: number
          roadmap_type?: string
          started_at?: string | null
          status?: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          phase_number?: number
          roadmap_type?: string
          started_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
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
      task_history: {
        Row: {
          archived_at: string
          completed_at: string | null
          id: string
          title: string
        }
        Insert: {
          archived_at?: string
          completed_at?: string | null
          id?: string
          title: string
        }
        Update: {
          archived_at?: string
          completed_at?: string | null
          id?: string
          title?: string
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
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
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
          {
            foreignKeyName: "training_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_templates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
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
      user_packages: {
        Row: {
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          package_id: string
          purchased_at: string
          sessions_total: number
          sessions_used: number
          status: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          expires_at: string
          id?: string
          package_id: string
          purchased_at?: string
          sessions_total: number
          sessions_used?: number
          status?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          package_id?: string
          purchased_at?: string
          sessions_total?: number
          sessions_used?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "coach_packages"
            referencedColumns: ["id"]
          },
        ]
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
      user_usage: {
        Row: {
          created_at: string
          daily_messages_sent: number
          id: string
          last_message_reset_at: string | null
          last_upload_at: string | null
          total_storage_bytes: number
          updated_at: string
          upload_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_messages_sent?: number
          id?: string
          last_message_reset_at?: string | null
          last_upload_at?: string | null
          total_storage_bytes?: number
          updated_at?: string
          upload_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          daily_messages_sent?: number
          id?: string
          last_message_reset_at?: string | null
          last_upload_at?: string | null
          total_storage_bytes?: number
          updated_at?: string
          upload_count?: number
          user_id?: string
        }
        Relationships: []
      }
      utm_conversions: {
        Row: {
          captured_at: string | null
          converted_at: string
          id: string
          landing_page: string | null
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          captured_at?: string | null
          converted_at?: string
          id?: string
          landing_page?: string | null
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          captured_at?: string | null
          converted_at?: string
          id?: string
          landing_page?: string | null
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
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
          {
            foreignKeyName: "verification_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_stats"
            referencedColumns: ["coach_id"]
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
      coach_profiles_public: {
        Row: {
          bio: string | null
          bit_link: string | null
          coach_name: string | null
          cover_media: string | null
          created_at: string | null
          followers: number | null
          id: string | null
          image_url: string | null
          insurance_doc_url: string | null
          insurance_expiry_date: string | null
          insurance_verified_at: string | null
          is_boosted: boolean | null
          is_fake: boolean | null
          is_pro: boolean | null
          is_verified: boolean | null
          location: string | null
          paybox_link: string | null
          payment_phone: string | null
          price: number | null
          rating: number | null
          sport: string | null
          updated_at: string | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          bit_link?: never
          coach_name?: string | null
          cover_media?: string | null
          created_at?: string | null
          followers?: number | null
          id?: string | null
          image_url?: string | null
          insurance_doc_url?: never
          insurance_expiry_date?: string | null
          insurance_verified_at?: string | null
          is_boosted?: boolean | null
          is_fake?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          paybox_link?: never
          payment_phone?: never
          price?: number | null
          rating?: number | null
          sport?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          bit_link?: never
          coach_name?: string | null
          cover_media?: string | null
          created_at?: string | null
          followers?: number | null
          id?: string | null
          image_url?: string | null
          insurance_doc_url?: never
          insurance_expiry_date?: string | null
          insurance_verified_at?: string | null
          is_boosted?: boolean | null
          is_fake?: boolean | null
          is_pro?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          paybox_link?: never
          payment_phone?: never
          price?: number | null
          rating?: number | null
          sport?: string | null
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      coach_stats: {
        Row: {
          active_bookings: number | null
          avg_rating: number | null
          coach_id: string | null
          coach_name: string | null
          follower_count: number | null
          is_boosted: boolean | null
          is_pro: boolean | null
          is_verified: boolean | null
          location: string | null
          pending_bookings: number | null
          price: number | null
          refreshed_at: string | null
          revenue_30d: number | null
          review_count: number | null
          sport: string | null
          total_bookings: number | null
          total_likes: number | null
          total_revenue: number | null
          total_views: number | null
          user_id: string | null
          video_count: number | null
        }
        Relationships: []
      }
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
      archive_done_tasks: { Args: never; Returns: number }
      assign_admin: { Args: { _target_user_id: string }; Returns: undefined }
      award_training_xp: {
        Args: { _user_id: string; _xp_amount?: number }
        Returns: Json
      }
      capture_partition_health: { Args: never; Returns: Json }
      check_daily_messages: {
        Args: { _receiver_id: string; _sender_id: string }
        Returns: Json
      }
      check_feed_action_rate: {
        Args: { _action_type: string; _user_id: string }
        Returns: Json
      }
      check_pending_bookings: { Args: { _user_id: string }; Returns: Json }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_sec: number }
        Returns: Json
      }
      check_scraping: { Args: { _user_id: string }; Returns: Json }
      check_upload_limit: { Args: { _user_id: string }; Returns: Json }
      cleanup_rate_limit_buckets: { Args: never; Returns: undefined }
      coach_stats_is_stale: {
        Args: { p_threshold_minutes?: number }
        Returns: {
          is_stale: boolean
          last_refreshed_at: string
          minutes_since: number
          threshold_minutes: number
        }[]
      }
      confirm_payment: {
        Args: {
          p_error_detail?: string
          p_grow_ref?: string
          p_idempotency_key: string
          p_status: string
        }
        Returns: Json
      }
      count_campaign_audience: {
        Args: { p_segment_roles?: string[]; p_segment_sports?: string[] }
        Returns: number
      }
      create_messages_partition: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
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
      enroll_in_email_sequence: {
        Args: { p_metadata?: Json; p_type: string; p_user_id: string }
        Returns: string
      }
      ensure_messages_partitions: { Args: never; Returns: undefined }
      get_coach_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_bookings: number
          avg_rating: number
          coach_id: string
          follower_count: number
          pending_bookings: number
          refreshed_at: string
          revenue_30d: number
          review_count: number
          total_bookings: number
          total_likes: number
          total_revenue: number
          total_views: number
          video_count: number
        }[]
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
      get_inactive_users_for_reengagement: {
        Args: { p_inactive_days?: number }
        Returns: {
          user_id: string
        }[]
      }
      get_own_coach_payment_fields: {
        Args: { _coach_profile_id: string }
        Returns: Json
      }
      get_partition_health: { Args: never; Returns: Json }
      get_query_performance_summary: {
        Args: never
        Returns: {
          avg_exec_time_ms: number
          cache_hit_ratio: number
          slow_queries_count: number
          total_calls: number
          total_exec_time_ms: number
          total_queries: number
        }[]
      }
      get_slow_queries: {
        Args: { p_limit?: number; p_min_avg_ms?: number }
        Returns: {
          avg_exec_time_ms: number
          cache_hit_ratio: number
          calls: number
          max_exec_time_ms: number
          min_exec_time_ms: number
          query: string
          rows_returned: number
          shared_blks_hit: number
          shared_blks_read: number
          stddev_exec_time_ms: number
          total_exec_time_ms: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_views: { Args: { post_slug: string }; Returns: undefined }
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
      refresh_coach_stats: { Args: never; Returns: undefined }
      refresh_coach_stats_logged: { Args: never; Returns: undefined }
      search_coaches: {
        Args: { search_term: string }
        Returns: {
          bio: string
          coach_name: string
          followers: number
          id: string
          image_url: string
          is_boosted: boolean
          is_fake: boolean
          is_pro: boolean
          is_verified: boolean
          location: string
          price: number
          rating: number
          similarity_score: number
          specialties: string[]
          sport: string
          tagline: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unsubscribe_from_email_sequences: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      write_audit_log: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _metadata?: Json
          _new_value?: Json
          _old_value?: Json
          _target_id?: string
          _target_table?: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "coach" | "developer" | "premium_coach"
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
        | "payment_change"
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
      app_role: ["admin", "user", "coach", "developer", "premium_coach"],
      audit_action: [
        "role_change",
        "payment_access",
        "profile_edit",
        "coach_status_change",
        "booking_change",
        "verification_change",
        "account_delete",
        "admin_action",
        "login",
        "password_reset",
        "payment_change",
      ],
    },
  },
} as const
