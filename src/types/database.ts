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
      budget_history: {
        Row: {
          ai_generated_budget: Json
          budget_type: string | null
          chat_history: Json | null
          created_at: string
          edit_count: number | null
          end_date: string | null
          estimated_expense: number | null
          first_prompt: Json | null
          id: string
          last_ai_feedback: string | null
          manual_adjustments: Json | null
          period: string
          start_date: string | null
          status: string | null
          uploaded_files: Json | null
          user_id: string
        }
        Insert: {
          ai_generated_budget: Json
          budget_type?: string | null
          chat_history?: Json | null
          created_at?: string
          edit_count?: number | null
          end_date?: string | null
          estimated_expense?: number | null
          first_prompt?: Json | null
          id?: string
          last_ai_feedback?: string | null
          manual_adjustments?: Json | null
          period: string
          start_date?: string | null
          status?: string | null
          uploaded_files?: Json | null
          user_id: string
        }
        Update: {
          ai_generated_budget?: Json
          budget_type?: string | null
          chat_history?: Json | null
          created_at?: string
          edit_count?: number | null
          end_date?: string | null
          estimated_expense?: number | null
          first_prompt?: Json | null
          id?: string
          last_ai_feedback?: string | null
          manual_adjustments?: Json | null
          period?: string
          start_date?: string | null
          status?: string | null
          uploaded_files?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      budget_realization: {
        Row: {
          category: string
          created_at: string | null
          id: string
          notes: string | null
          planned_amount: number
          realization_date: string
          realized_expense: number
          realized_income: number
          session_id: string
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          realization_date?: string
          realized_expense?: number
          realized_income?: number
          session_id: string
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          realization_date?: string
          realized_expense?: number
          realized_income?: number
          session_id?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_realization_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "budget_history"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_realization_insights: {
        Row: {
          ai_insight: string
          analysis_data: Json | null
          created_at: string | null
          id: string
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_insight: string
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_insight?: string
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_realization_insights_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "budget_history"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          id: string
          item: string
          notes: string | null
          session_id: string
          source: string
          transaction_date: string
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          id?: string
          item: string
          notes?: string | null
          session_id: string
          source?: string
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          id?: string
          item?: string
          notes?: string | null
          session_id?: string
          source?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "budget_history"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          badge: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          extracted_data: Json
          id: string
          source_file: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data: Json
          id?: string
          source_file?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json
          id?: string
          source_file?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          age: number | null
          created_at: string
          financial_type: string | null
          gender: string | null
          id: string
          investment_level: string | null
          job: string | null
          location: string | null
          marital_status: string | null
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          financial_type?: string | null
          gender?: string | null
          id?: string
          investment_level?: string | null
          job?: string | null
          location?: string | null
          marital_status?: string | null
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          financial_type?: string | null
          gender?: string | null
          id?: string
          investment_level?: string | null
          job?: string | null
          location?: string | null
          marital_status?: string | null
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
