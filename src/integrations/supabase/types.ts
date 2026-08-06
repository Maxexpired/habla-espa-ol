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
      course_lessons: {
        Row: {
          archived_at: string | null
          available_from: string | null
          available_until: string | null
          color: string | null
          course_id: string
          created_at: string
          description: string | null
          estimated_minutes: number
          icon: string | null
          id: string
          is_preview: boolean
          is_required: boolean
          is_visible: boolean
          section_id: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          available_from?: string | null
          available_until?: string | null
          color?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          icon?: string | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          is_visible?: boolean
          section_id: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          available_from?: string | null
          available_until?: string | null
          color?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          icon?: string | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          is_visible?: boolean
          section_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_resources: {
        Row: {
          archived_at: string | null
          course_id: string
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
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
      course_sections: {
        Row: {
          archived_at: string | null
          color: string | null
          course_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_visible: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          snapshot: Json
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          snapshot: Json
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          archived_at: string | null
          created_at: string
          currency: string
          description: string
          estimated_minutes: number
          featured: boolean
          id: string
          image_url: string | null
          instructor_id: string | null
          is_free: boolean
          level: string | null
          price: number
          published: boolean
          scheduled_at: string | null
          status: Database["public"]["Enums"]["course_status"]
          title: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          description: string
          estimated_minutes?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_free?: boolean
          level?: string | null
          price?: number
          published?: boolean
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          title: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          description?: string
          estimated_minutes?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          is_free?: boolean
          level?: string | null
          price?: number
          published?: boolean
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["course_status"]
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
      lesson_blocks: {
        Row: {
          archived_at: string | null
          color: string | null
          content: Json
          course_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_visible: boolean
          lesson_id: string
          settings: Json
          sort_order: number
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          content?: Json
          course_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          lesson_id: string
          settings?: Json
          sort_order?: number
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          content?: Json
          course_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          lesson_id?: string
          settings?: Json
          sort_order?: number
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_activity_at: string
          last_position: number
          lesson_id: string
          seconds_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_activity_at?: string
          last_position?: number
          lesson_id: string
          seconds_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_activity_at?: string
          last_position?: number
          lesson_id?: string
          seconds_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          bucket: string
          created_at: string
          id: string
          kind: string
          mime_type: string | null
          name: string
          path: string
          size_bytes: number
          updated_at: string
          uploaded_by: string | null
          url: string
          usage_count: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          name: string
          path: string
          size_bytes?: number
          updated_at?: string
          uploaded_by?: string | null
          url: string
          usage_count?: number
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          name?: string
          path?: string
          size_bytes?: number
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          usage_count?: number
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
      quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          course_id: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          course_id: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          started_at?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          course_id?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean
          label: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          label: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          label?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          points: number
          question: string
          quiz_id: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          points?: number
          question: string
          quiz_id: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          points?: number
          question?: string
          quiz_id?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          archived_at: string | null
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_visible: boolean
          lesson_id: string | null
          max_attempts: number
          passing_score: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_visible?: boolean
          lesson_id?: string | null
          max_attempts?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
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
      get_academic_analytics: {
        Args: never
        Returns: {
          abandoned: number
          avg_minutes: number
          avg_progress: number
          completion_rate: number
          course_id: string
          course_title: string
          lessons: number
          students: number
        }[]
      }
      get_course_average_rating: {
        Args: { course_uuid: string }
        Returns: number
      }
      get_course_progress: {
        Args: { _course_id: string; _user_id: string }
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
      is_enrolled: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      course_status: "draft" | "scheduled" | "published" | "archived" | "hidden"
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
      course_status: ["draft", "scheduled", "published", "archived", "hidden"],
    },
  },
} as const
