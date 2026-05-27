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
      activity_feed_items: {
        Row: {
          action: string
          avatar_url: string | null
          created_at: string
          icon_type: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          time_label: string
          updated_at: string
        }
        Insert: {
          action: string
          avatar_url?: string | null
          created_at?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          time_label?: string
          updated_at?: string
        }
        Update: {
          action?: string
          avatar_url?: string | null
          created_at?: string
          icon_type?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          time_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_user_context: {
        Row: {
          assessment_score: number | null
          assessment_type: string | null
          build_goal: string | null
          challenge_day: number | null
          challenge_outputs: Json
          completed_modules: string[]
          created_at: string
          id: string
          is_premium: boolean
          last_active_stage: string | null
          lms_progress: Json
          partner_code: string | null
          referral_count: number
          updated_at: string
          user_id: string
          weak_dimension: string | null
        }
        Insert: {
          assessment_score?: number | null
          assessment_type?: string | null
          build_goal?: string | null
          challenge_day?: number | null
          challenge_outputs?: Json
          completed_modules?: string[]
          created_at?: string
          id?: string
          is_premium?: boolean
          last_active_stage?: string | null
          lms_progress?: Json
          partner_code?: string | null
          referral_count?: number
          updated_at?: string
          user_id: string
          weak_dimension?: string | null
        }
        Update: {
          assessment_score?: number | null
          assessment_type?: string | null
          build_goal?: string | null
          challenge_day?: number | null
          challenge_outputs?: Json
          completed_modules?: string[]
          created_at?: string
          id?: string
          is_premium?: boolean
          last_active_stage?: string | null
          lms_progress?: Json
          partner_code?: string | null
          referral_count?: number
          updated_at?: string
          user_id?: string
          weak_dimension?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_description: string | null
          badge_icon: string
          badge_id: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string
          badge_id: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string
          badge_id?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          ai_outputs: Json
          completed: boolean
          created_at: string
          current_day: number
          id: string
          launch_url: string | null
          started_at: string
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_outputs?: Json
          completed?: boolean
          created_at?: string
          current_day?: number
          id?: string
          launch_url?: string | null
          started_at?: string
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_outputs?: Json
          completed?: boolean
          created_at?: string
          current_day?: number
          id?: string
          launch_url?: string | null
          started_at?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_cents: number
          approved_at: string | null
          commission_type: Database["public"]["Enums"]["commission_kind"]
          commission_value_snapshot: number
          created_at: string
          id: string
          level: number
          notes: string | null
          paid_at: string | null
          partner_id: string
          payout_id: string | null
          purchase_id: string | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          approved_at?: string | null
          commission_type: Database["public"]["Enums"]["commission_kind"]
          commission_value_snapshot: number
          created_at?: string
          id?: string
          level?: number
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          payout_id?: string | null
          purchase_id?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          commission_type?: Database["public"]["Enums"]["commission_kind"]
          commission_value_snapshot?: number
          created_at?: string
          id?: string
          level?: number
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          payout_id?: string | null
          purchase_id?: string | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_commissions_payout"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_config: {
        Row: {
          created_at: string
          fallback_message: string
          id: string
          next_qa_date: string | null
          starter_questions: Json
          system_prompt: string
          updated_at: string
          welcome_message: string
        }
        Insert: {
          created_at?: string
          fallback_message?: string
          id?: string
          next_qa_date?: string | null
          starter_questions?: Json
          system_prompt?: string
          updated_at?: string
          welcome_message?: string
        }
        Update: {
          created_at?: string
          fallback_message?: string
          id?: string
          next_qa_date?: string | null
          starter_questions?: Json
          system_prompt?: string
          updated_at?: string
          welcome_message?: string
        }
        Relationships: []
      }
      copilot_qa: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          commission_type: Database["public"]["Enums"]["commission_kind"] | null
          commission_value: number | null
          created_at: string
          expires_at: string | null
          final_price: number
          id: string
          is_active: boolean
          label: string
          max_redemptions: number | null
          notes: string | null
          original_price: number
          partner_id: string | null
          redemption_count: number
          updated_at: string
        }
        Insert: {
          code: string
          commission_type?:
            | Database["public"]["Enums"]["commission_kind"]
            | null
          commission_value?: number | null
          created_at?: string
          expires_at?: string | null
          final_price?: number
          id?: string
          is_active?: boolean
          label?: string
          max_redemptions?: number | null
          notes?: string | null
          original_price?: number
          partner_id?: string | null
          redemption_count?: number
          updated_at?: string
        }
        Update: {
          code?: string
          commission_type?:
            | Database["public"]["Enums"]["commission_kind"]
            | null
          commission_value?: number | null
          created_at?: string
          expires_at?: string | null
          final_price?: number
          id?: string
          is_active?: boolean
          label?: string
          max_redemptions?: number | null
          notes?: string | null
          original_price?: number
          partner_id?: string | null
          redemption_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "coupons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_promotions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          impressions: number
          is_active: boolean
          priority: number
          promoter_id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          priority?: number
          promoter_id: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          priority?: number
          promoter_id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_promotions_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_responses: {
        Row: {
          created_at: string
          id: string
          max_percent: number
          messages: Json
          min_percent: number
          tier: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_percent: number
          messages?: Json
          min_percent: number
          tier: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_percent?: number
          messages?: Json
          min_percent?: number
          tier?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          html_body: string
          id: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          html_body: string
          id: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          html_body?: string
          id?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      founding_config: {
        Row: {
          created_at: string
          cutoff_date: string | null
          id: string
          max_founders: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cutoff_date?: string | null
          id?: string
          max_founders?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cutoff_date?: string | null
          id?: string
          max_founders?: number
          updated_at?: string
        }
        Relationships: []
      }
      kb_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          search_tsv: unknown
          slug: string
          source: string | null
          stage: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          search_tsv?: unknown
          slug: string
          source?: string | null
          stage?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          search_tsv?: unknown
          slug?: string
          source?: string | null
          stage?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_overrides: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          referral_adjustment: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          referral_adjustment?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          referral_adjustment?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          audience: Json
          created_at: string
          created_by: string | null
          failed_count: number
          html_body: string
          id: string
          recipient_count: number
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          unsubscribe_count: number
          updated_at: string
        }
        Insert: {
          audience?: Json
          created_at?: string
          created_by?: string | null
          failed_count?: number
          html_body: string
          id?: string
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          unsubscribe_count?: number
          updated_at?: string
        }
        Update: {
          audience?: Json
          created_at?: string
          created_by?: string | null
          failed_count?: number
          html_body?: string
          id?: string
          recipient_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          unsubscribe_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_sends: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          name: string | null
          resend_id: string | null
          sent_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          name?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          name?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_suppressions: {
        Row: {
          email: string
          id: string
          source_campaign_id: string | null
          unsubscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          source_campaign_id?: string | null
          unsubscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          source_campaign_id?: string | null
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_suppressions_source_campaign_id_fkey"
            columns: ["source_campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_templates: {
        Row: {
          created_at: string
          created_by: string | null
          html_body: string
          id: string
          is_welcome: boolean
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_body: string
          id?: string
          is_welcome?: boolean
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_body?: string
          id?: string
          is_welcome?: boolean
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          token?: string
        }
        Relationships: []
      }
      partner_contributions: {
        Row: {
          contribution_description: string
          contribution_title: string
          contribution_url: string
          created_at: string
          estimated_value: number
          id: string
          review_notes: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contribution_description: string
          contribution_title: string
          contribution_url: string
          created_at?: string
          estimated_value?: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contribution_description?: string
          contribution_title?: string
          contribution_url?: string
          created_at?: string
          estimated_value?: number
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invitee_email: string
          invitee_partner_id: string | null
          inviter_partner_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitee_email: string
          invitee_partner_id?: string | null
          inviter_partner_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invitee_email?: string
          invitee_partner_id?: string | null
          inviter_partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invites_invitee_partner_id_fkey"
            columns: ["invitee_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_invites_invitee_partner_id_fkey"
            columns: ["invitee_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invites_inviter_partner_id_fkey"
            columns: ["inviter_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_invites_inviter_partner_id_fkey"
            columns: ["inviter_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          default_commission_type: Database["public"]["Enums"]["commission_kind"]
          default_commission_value: number
          default_l2_commission_type: Database["public"]["Enums"]["commission_kind"]
          default_l2_commission_value: number
          display_name: string | null
          id: string
          landing_path: string
          manual_score_adjustment: number
          notes: string | null
          parent_partner_id: string | null
          slug: string
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          default_commission_type?: Database["public"]["Enums"]["commission_kind"]
          default_commission_value?: number
          default_l2_commission_type?: Database["public"]["Enums"]["commission_kind"]
          default_l2_commission_value?: number
          display_name?: string | null
          id?: string
          landing_path?: string
          manual_score_adjustment?: number
          notes?: string | null
          parent_partner_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          default_commission_type?: Database["public"]["Enums"]["commission_kind"]
          default_commission_value?: number
          default_l2_commission_type?: Database["public"]["Enums"]["commission_kind"]
          default_l2_commission_value?: number
          display_name?: string | null
          id?: string
          landing_path?: string
          manual_score_adjustment?: number
          notes?: string | null
          parent_partner_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partners_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          currency: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          partner_id: string
          period_end: string | null
          period_start: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          period_end?: string | null
          period_start?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          direct_referral_count: number
          email: string | null
          entry_intent: string | null
          facebook_url: string | null
          first_name: string | null
          id: string
          indirect_referral_count: number
          instagram_url: string | null
          invite_code: string
          is_premium: boolean
          linkedin_url: string | null
          name: string | null
          partner_code_used: string | null
          premium_since: string | null
          referred_by: string | null
          referred_by_parent: string | null
          signup_product: string | null
          stripe_customer_id: string | null
          surname: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          direct_referral_count?: number
          email?: string | null
          entry_intent?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          indirect_referral_count?: number
          instagram_url?: string | null
          invite_code: string
          is_premium?: boolean
          linkedin_url?: string | null
          name?: string | null
          partner_code_used?: string | null
          premium_since?: string | null
          referred_by?: string | null
          referred_by_parent?: string | null
          signup_product?: string | null
          stripe_customer_id?: string | null
          surname?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          direct_referral_count?: number
          email?: string | null
          entry_intent?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          indirect_referral_count?: number
          instagram_url?: string | null
          invite_code?: string
          is_premium?: boolean
          linkedin_url?: string | null
          name?: string | null
          partner_code_used?: string | null
          premium_since?: string | null
          referred_by?: string | null
          referred_by_parent?: string | null
          signup_product?: string | null
          stripe_customer_id?: string | null
          surname?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["invite_code"]
          },
          {
            foreignKeyName: "profiles_referred_by_parent_fkey"
            columns: ["referred_by_parent"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["invite_code"]
          },
        ]
      }
      promoters: {
        Row: {
          approved_at: string | null
          assessment_starts: number
          conversions: number
          created_at: string
          founding_joined_at: string | null
          founding_rank: number | null
          id: string
          is_approved: boolean
          is_eligible_for_promotion: boolean
          is_founding_partner: boolean
          partner_code: string
          quality_score: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          assessment_starts?: number
          conversions?: number
          created_at?: string
          founding_joined_at?: string | null
          founding_rank?: number | null
          id?: string
          is_approved?: boolean
          is_eligible_for_promotion?: boolean
          is_founding_partner?: boolean
          partner_code: string
          quality_score?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          assessment_starts?: number
          conversions?: number
          created_at?: string
          founding_joined_at?: string | null
          founding_rank?: number | null
          id?: string
          is_approved?: boolean
          is_eligible_for_promotion?: boolean
          is_founding_partner?: boolean
          partner_code?: string
          quality_score?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          coupon_code: string | null
          created_at: string
          currency: string
          environment: string
          id: string
          partner_code: string | null
          price_id: string | null
          refunded_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          partner_code?: string | null
          price_id?: string | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          partner_code?: string | null
          price_id?: string | null
          refunded_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_attributions: {
        Row: {
          bound_at: string
          created_at: string
          first_touch_at: string
          id: string
          landing_path: string | null
          landing_query: Json | null
          parent_partner_id: string | null
          partner_id: string
          partner_slug: string
          source: Database["public"]["Enums"]["attribution_source"]
          user_id: string
        }
        Insert: {
          bound_at?: string
          created_at?: string
          first_touch_at?: string
          id?: string
          landing_path?: string | null
          landing_query?: Json | null
          parent_partner_id?: string | null
          partner_id: string
          partner_slug: string
          source?: Database["public"]["Enums"]["attribution_source"]
          user_id: string
        }
        Update: {
          bound_at?: string
          created_at?: string
          first_touch_at?: string
          id?: string
          landing_path?: string | null
          landing_query?: Json | null
          parent_partner_id?: string | null
          partner_id?: string
          partner_slug?: string
          source?: Database["public"]["Enums"]["attribution_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_attributions_parent_partner_id_fkey"
            columns: ["parent_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_leaderboard"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "referral_attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string | null
          page: string
          section: string
          sort_order: number
          updated_at: string
          value: string
          value_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label?: string | null
          page: string
          section?: string
          sort_order?: number
          updated_at?: string
          value?: string
          value_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string | null
          page?: string
          section?: string
          sort_order?: number
          updated_at?: string
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          created_at: string
          day1_watched: boolean
          day2_watched: boolean
          day3_watched: boolean
          hub_completed: boolean
          id: string
          pre_challenge_watched: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day1_watched?: boolean
          day2_watched?: boolean
          day3_watched?: boolean
          hub_completed?: boolean
          id?: string
          pre_challenge_watched?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day1_watched?: boolean
          day2_watched?: boolean
          day3_watched?: boolean
          hub_completed?: boolean
          id?: string
          pre_challenge_watched?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unlocks: {
        Row: {
          id: string
          name: string
          reason: string | null
          unlock_id: string
          unlocked_at: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          name: string
          reason?: string | null
          unlock_id: string
          unlocked_at?: string
          user_id: string
          value?: number
        }
        Update: {
          id?: string
          name?: string
          reason?: string | null
          unlock_id?: string
          unlocked_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          audience_type: string
          challenge_name: string
          challenge_type: string
          created_at: string
          desired_outcome: string
          id: string
          name: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_type?: string
          challenge_name?: string
          challenge_type?: string
          created_at?: string
          desired_outcome?: string
          id?: string
          name?: string
          topic?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_type?: string
          challenge_name?: string
          challenge_type?: string
          created_at?: string
          desired_outcome?: string
          id?: string
          name?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          confirmed_invites: number
          created_at: string
          current_tier: string
          email: string
          first_name: string | null
          id: string
          name: string | null
          referral_code: string
          referred_by_code: string | null
          self_referral_reasons: string[]
          signup_ip: string | null
          status: string
          surname: string | null
          suspected_self_referral: boolean
          updated_at: string
          waitlist_position: number
        }
        Insert: {
          confirmed_invites?: number
          created_at?: string
          current_tier?: string
          email: string
          first_name?: string | null
          id?: string
          name?: string | null
          referral_code: string
          referred_by_code?: string | null
          self_referral_reasons?: string[]
          signup_ip?: string | null
          status?: string
          surname?: string | null
          suspected_self_referral?: boolean
          updated_at?: string
          waitlist_position?: number
        }
        Update: {
          confirmed_invites?: number
          created_at?: string
          current_tier?: string
          email?: string
          first_name?: string | null
          id?: string
          name?: string | null
          referral_code?: string
          referred_by_code?: string | null
          self_referral_reasons?: string[]
          signup_ip?: string | null
          status?: string
          surname?: string | null
          suspected_self_referral?: boolean
          updated_at?: string
          waitlist_position?: number
        }
        Relationships: []
      }
    }
    Views: {
      partner_leaderboard: {
        Row: {
          display_name: string | null
          manual_score_adjustment: number | null
          partner_id: string | null
          signups: number | null
          slug: string | null
          status: Database["public"]["Enums"]["partner_status"] | null
          total_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_partner_score: {
        Args: { p_delta: number; p_partner_id: string }
        Returns: undefined
      }
      admin_approve_commission: {
        Args: { p_commission_id: string }
        Returns: undefined
      }
      admin_approve_partner_commissions: {
        Args: { p_partner_id: string }
        Returns: number
      }
      admin_clear_self_referral_flag: {
        Args: { p_signup_id: string }
        Returns: undefined
      }
      admin_create_payout: {
        Args: {
          p_commission_ids: string[]
          p_method?: string
          p_notes?: string
          p_partner_id: string
          p_reference?: string
        }
        Returns: string
      }
      admin_mark_payout_paid: {
        Args: { p_payout_id: string; p_reference?: string }
        Returns: undefined
      }
      admin_merge_partners: {
        Args: { p_keep: string; p_remove: string }
        Returns: undefined
      }
      admin_reassign_attribution: {
        Args: { p_new_partner_slug: string; p_user_id: string }
        Returns: undefined
      }
      admin_revoke_commission: {
        Args: { p_commission_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_void_payout: { Args: { p_payout_id: string }; Returns: undefined }
      admin_void_waitlist_referral: {
        Args: { p_signup_id: string }
        Returns: undefined
      }
      calculate_waitlist_tier: {
        Args: { invite_count: number }
        Returns: string
      }
      get_partner_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          display_name: string
          manual_score_adjustment: number
          partner_id: string
          signups: number
          slug: string
          total_score: number
        }[]
      }
      get_welcome_auto_send: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_partner_referral: {
        Args: { p_partner_code: string }
        Returns: undefined
      }
      redeem_coupon: { Args: { p_code: string }; Returns: Json }
      set_welcome_auto_send: { Args: { p_enabled: boolean }; Returns: boolean }
      track_partner_assessment: {
        Args: { p_partner_code: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      attribution_source:
        | "query_param"
        | "partner_landing"
        | "invite_link"
        | "coupon"
        | "manual"
      commission_kind: "percent" | "fixed"
      commission_status: "pending" | "approved" | "paid" | "revoked"
      partner_status: "pending" | "active" | "suspended"
      payout_status: "pending" | "paid" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      attribution_source: [
        "query_param",
        "partner_landing",
        "invite_link",
        "coupon",
        "manual",
      ],
      commission_kind: ["percent", "fixed"],
      commission_status: ["pending", "approved", "paid", "revoked"],
      partner_status: ["pending", "active", "suspended"],
      payout_status: ["pending", "paid", "cancelled"],
    },
  },
} as const
