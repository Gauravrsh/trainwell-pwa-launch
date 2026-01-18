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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          actual_reps: number | null
          actual_sets: number | null
          actual_weight: number | null
          created_at: string | null
          exercise_name: string
          id: string
          recommended_reps: number | null
          recommended_sets: number | null
          recommended_weight: number | null
          updated_at: string | null
          workout_id: string
        }
        Insert: {
          actual_reps?: number | null
          actual_sets?: number | null
          actual_weight?: number | null
          created_at?: string | null
          exercise_name: string
          id?: string
          recommended_reps?: number | null
          recommended_sets?: number | null
          recommended_weight?: number | null
          updated_at?: string | null
          workout_id: string
        }
        Update: {
          actual_reps?: number | null
          actual_sets?: number | null
          actual_weight?: number | null
          created_at?: string | null
          exercise_name?: string
          id?: string
          recommended_reps?: number | null
          recommended_sets?: number | null
          recommended_weight?: number | null
          updated_at?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: number | null
          carbs: number | null
          client_id: string
          created_at: string | null
          fat: number | null
          id: string
          logged_date: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein: number | null
          raw_text: string | null
          updated_at: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          client_id: string
          created_at?: string | null
          fat?: number | null
          id?: string
          logged_date: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          protein?: number | null
          raw_text?: string | null
          updated_at?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          client_id?: string
          created_at?: string | null
          fat?: number | null
          id?: string
          logged_date?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          protein?: number | null
          raw_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          razorpay_order_id: string | null
          subscription_cycle_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          razorpay_order_id?: string | null
          subscription_cycle_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          razorpay_order_id?: string | null
          subscription_cycle_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_cycle_id_fkey"
            columns: ["subscription_cycle_id"]
            isOneToOne: false
            referencedRelation: "subscription_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          profile_complete: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          trainer_id: string | null
          unique_id: string
          updated_at: string | null
          user_id: string
          vpa_address: string | null
          weight_kg: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          profile_complete?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
          unique_id: string
          updated_at?: string | null
          user_id: string
          vpa_address?: string | null
          weight_kg?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          profile_complete?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
          unique_id?: string
          updated_at?: string | null
          user_id?: string
          vpa_address?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_cycles: {
        Row: {
          client_id: string
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          id: string
          status: Database["public"]["Enums"]["workout_status"] | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          status?: Database["public"]["Enums"]["workout_status"] | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          status?: Database["public"]["Enums"]["workout_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_unique_id: {
        Args: { p_role: Database["public"]["Enums"]["user_role"] }
        Returns: string
      }
      get_client_profile_for_trainer: {
        Args: { _client_profile_id: string }
        Returns: {
          city: string
          created_at: string
          date_of_birth: string
          full_name: string
          height_cm: number
          id: string
          profile_complete: boolean
          unique_id: string
          weight_kg: number
        }[]
      }
      get_trainer_clients: {
        Args: never
        Returns: {
          full_name: string
          id: string
          unique_id: string
        }[]
      }
      get_trainer_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_profile_owner: { Args: { _profile_id: string }; Returns: boolean }
      is_trainer_of_client: {
        Args: { _client_profile_id: string; _trainer_user_id: string }
        Returns: boolean
      }
      lookup_trainer_by_unique_id: {
        Args: { p_unique_id: string }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          unique_id: string
        }[]
      }
    }
    Enums: {
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_status: "active" | "pending_renewal" | "completed"
      user_role: "trainer" | "client"
      workout_status: "completed" | "skipped" | "pending"
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
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_status: ["active", "pending_renewal", "completed"],
      user_role: ["trainer", "client"],
      workout_status: ["completed", "skipped", "pending"],
    },
  },
} as const
