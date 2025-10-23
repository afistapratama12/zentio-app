export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          user_id: string
          name: string | null
          age: number | null
          gender: string | null
          marital_status: string | null
          job: string | null
          location: string | null
          investment_level: string | null
          financial_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          age?: number | null
          gender?: string | null
          marital_status?: string | null
          job?: string | null
          location?: string | null
          investment_level?: string | null
          financial_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          age?: number | null
          gender?: string | null
          marital_status?: string | null
          job?: string | null
          location?: string | null
          investment_level?: string | null
          financial_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          source_file: string | null
          extracted_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source_file?: string | null
          extracted_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source_file?: string | null
          extracted_data?: Json
          created_at?: string
        }
      }
      budget_history: {
        Row: {
          id: string
          user_id: string
          period: string
          ai_generated_budget: Json
          manual_adjustments: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: string
          ai_generated_budget: Json
          manual_adjustments?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: string
          ai_generated_budget?: Json
          manual_adjustments?: Json | null
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          user_id: string
          badge: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge?: string
          earned_at?: string
        }
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
  }
}
