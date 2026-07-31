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
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          created_at: string
          enrollment_id: string
          file_url: string | null
          id: string
          issued_at: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          created_at?: string
          enrollment_id: string
          file_url?: string | null
          id?: string
          issued_at?: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          file_url?: string | null
          id?: string
          issued_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          currency: string
          description: string
          id: string
          image_url: string | null
          instructor_id: string | null
          is_free: boolean
          price: number
          published: boolean
          title: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description: string
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_free?: boolean
          price?: number
          published?: boolean
          title: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_free?: boolean
          price?: number
          published?: boolean
          title?: string
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          provider: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          template_key: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          template_key?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          html_content: string
          id: string
          key: string
          name: string
          subject: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          key: string
          name: string
          subject: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          key?: string
          name?: string
          subject?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          created_at: string
          description: string
          excerpt: string | null
          featured: boolean
          gallery: string[]
          id: string
          image_url: string | null
          published: boolean
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          excerpt?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          excerpt?: string | null
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event: string
          id: string
          purchase_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status_code: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event: string
          id?: string
          purchase_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event?: string
          id?: string
          purchase_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category: string | null
          created_at: string
          description: string
          featured: boolean
          gallery: string[]
          id: string
          image_url: string | null
          published: boolean
          repo_url: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          repo_url?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          gallery?: string[]
          id?: string
          image_url?: string | null
          published?: boolean
          repo_url?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          approved_at: string | null
          authorization_code: string | null
          buy_order: string
          coupon_code: string | null
          course_id: string
          created_at: string
          currency: string
          discount_amount: number
          id: string
          installments: number | null
          payment_status: string
          payment_type: string | null
          refunded_at: string | null
          response_code: number | null
          session_id: string
          transaction_date: string | null
          transaction_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          authorization_code?: string | null
          buy_order: string
          coupon_code?: string | null
          course_id: string
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          installments?: number | null
          payment_status?: string
          payment_type?: string | null
          refunded_at?: string | null
          response_code?: number | null
          session_id: string
          transaction_date?: string | null
          transaction_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          authorization_code?: string | null
          buy_order?: string
          coupon_code?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          discount_amount?: number
          id?: string
          installments?: number | null
          payment_status?: string
          payment_type?: string | null
          refunded_at?: string | null
          response_code?: number | null
          session_id?: string
          transaction_date?: string | null
          transaction_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          extra: Json
          favicon_url: string | null
          id: string
          maintenance_mode: boolean
          og_image_url: string | null
          registration_enabled: boolean
          require_email_verification: boolean
          seo_description: string
          seo_title: string
          singleton: boolean
          social_facebook: string | null
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          extra?: Json
          favicon_url?: string | null
          id?: string
          maintenance_mode?: boolean
          og_image_url?: string | null
          registration_enabled?: boolean
          require_email_verification?: boolean
          seo_description?: string
          seo_title?: string
          singleton?: boolean
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          extra?: Json
          favicon_url?: string | null
          id?: string
          maintenance_mode?: boolean
          og_image_url?: string | null
          registration_enabled?: boolean
          require_email_verification?: boolean
          seo_description?: string
          seo_title?: string
          singleton?: boolean
          social_facebook?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          name: string
          role: string
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          name: string
          role: string
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          name?: string
          role?: string
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          sort_order?: number
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      generate_certificate_number: { Args: never; Returns: string }
      get_course_average_rating: {
        Args: { course_uuid: string }
        Returns: number
      }
      get_course_reviews_count: {
        Args: { course_uuid: string }
        Returns: number
      }
      get_review_authors: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
