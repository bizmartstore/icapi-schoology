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
      activities: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          instructions: string | null
          is_active: boolean
          section_subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          section_subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          section_subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_section_subject_id_fkey"
            columns: ["section_subject_id"]
            isOneToOne: false
            referencedRelation: "section_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_submissions: {
        Row: {
          activity_id: string
          id: string
          note: string | null
          student_id: string
          submitted_at: string
          url: string | null
        }
        Insert: {
          activity_id: string
          id?: string
          note?: string | null
          student_id: string
          submitted_at?: string
          url?: string | null
        }
        Update: {
          activity_id?: string
          id?: string
          note?: string | null
          student_id?: string
          submitted_at?: string
          url?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          from_name: string | null
          full_content: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_new: boolean | null
          preview_text: string | null
          scope: string
          section_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          from_name?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          preview_text?: string | null
          scope?: string
          section_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          from_name?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          preview_text?: string | null
          scope?: string
          section_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          gradient: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          section_subject_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          section_subject_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          section_subject_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_section_subject_id_fkey"
            columns: ["section_subject_id"]
            isOneToOne: false
            referencedRelation: "section_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter: string | null
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lesson_title: string
          progress: number | null
          school_level: Database["public"]["Enums"]["school_level"] | null
          subject_name: string
          time_left: string | null
          updated_at: string | null
        }
        Insert: {
          chapter?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lesson_title: string
          progress?: number | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_name: string
          time_left?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lesson_title?: string
          progress?: number | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_name?: string
          time_left?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          section_subject_id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          section_subject_id: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          section_subject_id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_section_subject_id_fkey"
            columns: ["section_subject_id"]
            isOneToOne: false
            referencedRelation: "section_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_by: string | null
          avatar_data: string | null
          contact_number: string
          created_at: string
          email: string
          first_name: string
          grade_level: string | null
          id: string
          last_name: string
          school: string | null
          school_level: Database["public"]["Enums"]["school_level"] | null
          subject_taught: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          avatar_data?: string | null
          contact_number: string
          created_at?: string
          email: string
          first_name: string
          grade_level?: string | null
          id?: string
          last_name: string
          school?: string | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_taught?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_by?: string | null
          avatar_data?: string | null
          contact_number?: string
          created_at?: string
          email?: string
          first_name?: string
          grade_level?: string | null
          id?: string
          last_name?: string
          school?: string | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_taught?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          choice_id: string | null
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          attempt_id: string
          choice_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          attempt_id?: string
          choice_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "quiz_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          score: number
          student_id: string
          submitted_at: string
          total_points: number
        }
        Insert: {
          id?: string
          quiz_id: string
          score?: number
          student_id: string
          submitted_at?: string
          total_points?: number
        }
        Update: {
          id?: string
          quiz_id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_choices: {
        Row: {
          choice_text: string
          created_at: string
          id: string
          is_correct: boolean
          position: number
          question_id: string
        }
        Insert: {
          choice_text: string
          created_at?: string
          id?: string
          is_correct?: boolean
          position?: number
          question_id: string
        }
        Update: {
          choice_text?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_choices_question_id_fkey"
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
          id: string
          points: number
          position: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          position?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          position?: number
          question_text?: string
          quiz_id?: string
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
          created_at: string
          created_by: string
          id: string
          instructions: string | null
          is_published: boolean
          section_subject_id: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          section_subject_id: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          section_subject_id?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_section_subject_id_fkey"
            columns: ["section_subject_id"]
            isOneToOne: false
            referencedRelation: "section_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      section_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          section_id: string
          status: Database["public"]["Enums"]["approval_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_join_requests_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_members: {
        Row: {
          id: string
          joined_at: string
          section_id: string
          student_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          section_id: string
          student_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          section_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_members_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          section_id: string
          sender_name: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          section_id: string
          sender_name?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          section_id?: string
          sender_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      section_subjects: {
        Row: {
          created_at: string
          id: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          color: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          name: string
          school_level: Database["public"]["Enums"]["school_level"] | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_level?: Database["public"]["Enums"]["school_level"] | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_level?: Database["public"]["Enums"]["school_level"] | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          grade_level: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          progress: number | null
          school_level: Database["public"]["Enums"]["school_level"]
          sort_order: number | null
          teacher_name: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          grade_level?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          progress?: number | null
          school_level: Database["public"]["Enums"]["school_level"]
          sort_order?: number | null
          teacher_name?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          grade_level?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          progress?: number | null
          school_level?: Database["public"]["Enums"]["school_level"]
          sort_order?: number | null
          teacher_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          is_urgent: boolean | null
          school_level: Database["public"]["Enums"]["school_level"] | null
          subject_name: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_name?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          school_level?: Database["public"]["Enums"]["school_level"] | null
          subject_name?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      can_manage_section_subject: {
        Args: { _ss_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_section_subject: {
        Args: { _ss_id: string; _user_id: string }
        Returns: boolean
      }
      get_approval_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["approval_status"]
      }
      grant_admin_role: { Args: { _user_id: string }; Returns: boolean }
      admin_set_user_role: {
        Args: { _target_user_id: string; _role: Database["public"]["Enums"]["app_role"]; _grant: boolean }
        Returns: boolean
      }
      admin_delete_user: { Args: { _target_user_id: string }; Returns: boolean }
      create_user_profile: {
        Args: {
          _first_name: string
          _last_name: string
          _contact_number: string
          _user_type: Database["public"]["Enums"]["user_type"]
          _school?: string | null
          _grade_level?: string | null
          _school_level?: Database["public"]["Enums"]["school_level"] | null
          _subject_taught?: string | null
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_section_member: {
        Args: { _section_id: string; _user_id: string }
        Returns: boolean
      }
      is_section_owner: {
        Args: { _section_id: string; _user_id: string }
        Returns: boolean
      }
      submit_quiz: { Args: { _answers: Json; _quiz_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "student" | "teacher"
      approval_status: "pending" | "approved" | "rejected"
      school_level: "elementary" | "junior_high_school"
      user_type: "student" | "teacher"
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
      app_role: ["admin", "student", "teacher"],
      approval_status: ["pending", "approved", "rejected"],
      school_level: ["elementary", "junior_high_school"],
      user_type: ["student", "teacher"],
    },
  },
} as const
