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
      facts: {
        Row: {
          id: string
          multiplicand: number
          multiplier: number
        }
        Insert: {
          id?: string
          multiplicand: number
          multiplier: number
        }
        Update: {
          id?: string
          multiplicand?: number
          multiplier?: number
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          fact_count: number
          correct_count: number
          incorrect_count: number
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time?: string
          end_time?: string | null
          fact_count?: number
          correct_count?: number
          incorrect_count?: number
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          fact_count?: number
          correct_count?: number
          incorrect_count?: number
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_facts: {
        Row: {
          id: string
          session_id: string
          fact_id: string
          is_correct: boolean | null
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          fact_id: string
          is_correct?: boolean | null
          response_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          fact_id?: string
          is_correct?: boolean | null
          response_time_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_facts_fact_id_fkey"
            columns: ["fact_id"]
            referencedRelation: "facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_facts_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_facts: {
        Row: {
          id: string
          user_id: string
          fact_id: string
          correct_count: number
          incorrect_count: number
          last_seen_at: string | null
          difficulty_rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fact_id: string
          correct_count?: number
          incorrect_count?: number
          last_seen_at?: string | null
          difficulty_rating?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          fact_id?: string
          correct_count?: number
          incorrect_count?: number
          last_seen_at?: string | null
          difficulty_rating?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_facts_fact_id_fkey"
            columns: ["fact_id"]
            referencedRelation: "facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_facts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
