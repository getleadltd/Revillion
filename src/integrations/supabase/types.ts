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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_tasks: {
        Row: {
          agents: Json | null
          completed_at: string | null
          created_at: string | null
          id: string
          input: Json | null
          score: number | null
          status: string
          summary: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          agents?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          input?: Json | null
          score?: number | null
          status?: string
          summary?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          agents?: Json | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          input?: Json | null
          score?: number | null
          status?: string
          summary?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          post_category: string | null
          post_id: string | null
          post_slug: string | null
          post_title: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          post_category?: string | null
          post_id?: string | null
          post_slug?: string | null
          post_title?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          post_category?: string | null
          post_id?: string | null
          post_slug?: string | null
          post_title?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string
          content_de: string | null
          content_en: string
          content_es: string | null
          content_it: string | null
          content_pt: string | null
          created_at: string | null
          excerpt_de: string | null
          excerpt_en: string | null
          excerpt_es: string | null
          excerpt_it: string | null
          excerpt_pt: string | null
          faq_items: Json | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          keywords: string[] | null
          meta_description_de: string | null
          meta_description_en: string | null
          meta_description_es: string | null
          meta_description_it: string | null
          meta_description_pt: string | null
          published_at: string | null
          schema_type: string | null
          slug: string
          slug_de: string | null
          slug_en: string | null
          slug_es: string | null
          slug_it: string | null
          slug_pt: string | null
          source: string | null
          source_language: string | null
          status: string
          title_de: string | null
          title_en: string
          title_es: string | null
          title_it: string | null
          title_pt: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string
          content_de?: string | null
          content_en: string
          content_es?: string | null
          content_it?: string | null
          content_pt?: string | null
          created_at?: string | null
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_it?: string | null
          excerpt_pt?: string | null
          faq_items?: Json | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description_de?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          meta_description_it?: string | null
          meta_description_pt?: string | null
          published_at?: string | null
          schema_type?: string | null
          slug: string
          slug_de?: string | null
          slug_en?: string | null
          slug_es?: string | null
          slug_it?: string | null
          slug_pt?: string | null
          source?: string | null
          source_language?: string | null
          status?: string
          title_de?: string | null
          title_en: string
          title_es?: string | null
          title_it?: string | null
          title_pt?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content_de?: string | null
          content_en?: string
          content_es?: string | null
          content_it?: string | null
          content_pt?: string | null
          created_at?: string | null
          excerpt_de?: string | null
          excerpt_en?: string | null
          excerpt_es?: string | null
          excerpt_it?: string | null
          excerpt_pt?: string | null
          faq_items?: Json | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description_de?: string | null
          meta_description_en?: string | null
          meta_description_es?: string | null
          meta_description_it?: string | null
          meta_description_pt?: string | null
          published_at?: string | null
          schema_type?: string | null
          slug?: string
          slug_de?: string | null
          slug_en?: string | null
          slug_es?: string | null
          slug_it?: string | null
          slug_pt?: string | null
          source?: string | null
          source_language?: string | null
          status?: string
          title_de?: string | null
          title_en?: string
          title_es?: string | null
          title_it?: string | null
          title_pt?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      blog_queue: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          generated_post_id: string | null
          id: string
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          generated_post_id?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_queue_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company_name: string | null
          contact_type: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          contact_type: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          contact_type?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_monitoring_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          execution_time_ms: number | null
          id: string
          issues_found: number | null
          scan_date: string | null
          scan_type: string
          status: string | null
          total_items_checked: number | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          issues_found?: number | null
          scan_date?: string | null
          scan_type: string
          status?: string | null
          total_items_checked?: number | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          issues_found?: number | null
          scan_date?: string | null
          scan_type?: string
          status?: string | null
          total_items_checked?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          description: string
          key: string
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string
          description?: string
          key: string
          label?: string
          updated_at?: string | null
          value?: string
        }
        Update: {
          category?: string
          description?: string
          key?: string
          label?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      url_redirects: {
        Row: {
          created_at: string
          hit_count: number
          id: string
          last_hit_at: string | null
          new_url: string
          old_url: string
          redirect_type: number
        }
        Insert: {
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string | null
          new_url: string
          old_url: string
          redirect_type?: number
        }
        Update: {
          created_at?: string
          hit_count?: number
          id?: string
          last_hit_at?: string | null
          new_url?: string
          old_url?: string
          redirect_type?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      track_redirect_hit: { Args: { redirect_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
