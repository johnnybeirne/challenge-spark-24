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
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_config: {
        Row: {
          created_at: string
          fallback_message: string
          id: string
          starter_questions: Json
          system_prompt: string
          updated_at: string
          welcome_message: string
        }
        Insert: {
          created_at?: string
          fallback_message?: string
          id?: string
          starter_questions?: Json
          system_prompt?: string
          updated_at?: string
          welcome_message?: string
        }
        Update: {
          created_at?: string
          fallback_message?: string
          id?: string
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
      profiles: {
        Row: {
          created_at: string
          direct_referral_count: number
          email: string | null
          id: string
          indirect_referral_count: number
          invite_code: string
          name: string | null
          referred_by: string | null
          referred_by_parent: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direct_referral_count?: number
          email?: string | null
          id?: string
          indirect_referral_count?: number
          invite_code: string
          name?: string | null
          referred_by?: string | null
          referred_by_parent?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direct_referral_count?: number
          email?: string | null
          id?: string
          indirect_referral_count?: number
          invite_code?: string
          name?: string | null
          referred_by?: string | null
          referred_by_parent?: string | null
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      track_partner_assessment: {
        Args: { p_partner_code: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
