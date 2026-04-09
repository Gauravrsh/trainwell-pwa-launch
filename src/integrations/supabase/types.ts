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
      client_training_plans: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          billing_model: Database["public"]["Enums"]["billing_model"]
          client_id: string
          completed_sessions: number | null
          created_at: string
          end_date: string
          id: string
          missed_sessions: number | null
          notes: string | null
          plan_name: string
          service_type: Database["public"]["Enums"]["service_type"]
          start_date: string
          status: Database["public"]["Enums"]["training_plan_status"]
          terminated_by: string | null
          termination_date: string | null
          total_amount: number
          total_sessions: number
          trainer_id: string
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_model?: Database["public"]["Enums"]["billing_model"]
          client_id: string
          completed_sessions?: number | null
          created_at?: string
          end_date: string
          id?: string
          missed_sessions?: number | null
          notes?: string | null
          plan_name: string
          service_type?: Database["public"]["Enums"]["service_type"]
          start_date: string
          status?: Database["public"]["Enums"]["training_plan_status"]
          terminated_by?: string | null
          termination_date?: string | null
          total_amount: number
          total_sessions: number
          trainer_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          billing_model?: Database["public"]["Enums"]["billing_model"]
          client_id?: string
          completed_sessions?: number | null
          created_at?: string
          end_date?: string
          id?: string
          missed_sessions?: number | null
          notes?: string | null
          plan_name?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["training_plan_status"]
          terminated_by?: string | null
          termination_date?: string | null
          total_amount?: number
          total_sessions?: number
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_training_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_training_plans_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      payment_info: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          updated_at: string | null
          vpa_address: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          updated_at?: string | null
          vpa_address?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          updated_at?: string | null
          vpa_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
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
      plan_sessions: {
        Row: {
          client_notes: string | null
          created_at: string
          food_log_id: string | null
          id: string
          plan_id: string
          reschedule_reason: string | null
          session_date: string
          session_number: number
          status: Database["public"]["Enums"]["session_status"]
          trainer_notes: string | null
          updated_at: string
          workout_id: string | null
        }
        Insert: {
          client_notes?: string | null
          created_at?: string
          food_log_id?: string | null
          id?: string
          plan_id: string
          reschedule_reason?: string | null
          session_date: string
          session_number: number
          status?: Database["public"]["Enums"]["session_status"]
          trainer_notes?: string | null
          updated_at?: string
          workout_id?: string | null
        }
        Update: {
          client_notes?: string | null
          created_at?: string
          food_log_id?: string | null
          id?: string
          plan_id?: string
          reschedule_reason?: string | null
          session_date?: string
          session_number?: number
          status?: Database["public"]["Enums"]["session_status"]
          trainer_notes?: string | null
          updated_at?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_sessions_food_log_id_fkey"
            columns: ["food_log_id"]
            isOneToOne: false
            referencedRelation: "food_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "client_training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bmr: number | null
          bmr_updated_at: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          height_cm: number | null
          id: string
          last_activity_date: string | null
          profile_complete: boolean | null
          referred_by_trainer_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          trainer_id: string | null
          unique_id: string
          updated_at: string | null
          user_id: string
          weight_kg: number | null
          whatsapp_no: string | null
        }
        Insert: {
          bmr?: number | null
          bmr_updated_at?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          last_activity_date?: string | null
          profile_complete?: boolean | null
          referred_by_trainer_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
          unique_id: string
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
          whatsapp_no?: string | null
        }
        Update: {
          bmr?: number | null
          bmr_updated_at?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          height_cm?: number | null
          id?: string
          last_activity_date?: string | null
          profile_complete?: boolean | null
          referred_by_trainer_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
          unique_id?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
          whatsapp_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_trainer_id_fkey"
            columns: ["referred_by_trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      trainer_notifications: {
        Row: {
          body: string
          created_at: string | null
          cta_action: string | null
          cta_text: string | null
          day_offset: number
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          notification_type: string
          scheduled_for: string
          title: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          cta_action?: string | null
          cta_text?: string | null
          day_offset: number
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          notification_type?: string
          scheduled_for: string
          title: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          cta_action?: string | null
          cta_text?: string | null
          day_offset?: number
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          notification_type?: string
          scheduled_for?: string
          title?: string
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trainer_platform_subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          end_date: string
          grace_end_date: string | null
          id: string
          is_trial_used: boolean | null
          max_trial_clients: number | null
          payment_status: string | null
          plan_type: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id: string
          trial_clients_count: number | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          end_date: string
          grace_end_date?: string | null
          id?: string
          is_trial_used?: boolean | null
          max_trial_clients?: number | null
          payment_status?: string | null
          plan_type?: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id: string
          trial_clients_count?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          end_date?: string
          grace_end_date?: string | null
          id?: string
          is_trial_used?: boolean | null
          max_trial_clients?: number | null
          payment_status?: string | null
          plan_type?: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id?: string
          trial_clients_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_platform_subscriptions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string
          referee_plan_at_reward:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          referrer_id: string
          referrer_plan_at_reward:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          reward_days: number | null
          rewarded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id: string
          referee_plan_at_reward?:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          referrer_id: string
          referrer_plan_at_reward?:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          reward_days?: number | null
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string
          referee_plan_at_reward?:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          referrer_id?: string
          referrer_plan_at_reward?:
            | Database["public"]["Enums"]["platform_plan_type"]
            | null
          reward_days?: number | null
          rewarded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_validity_extensions: {
        Row: {
          created_at: string
          days_credited: number
          days_deducted: number
          days_remaining: number
          id: string
          referral_id: string | null
          source: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_credited?: number
          days_deducted?: number
          days_remaining?: number
          id?: string
          referral_id?: string | null
          source: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_credited?: number
          days_deducted?: number
          days_remaining?: number
          id?: string
          referral_id?: string | null
          source?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_validity_extensions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "trainer_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_validity_extensions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          logged_date: string
          weight_kg: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          logged_date?: string
          weight_kg: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          logged_date?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          calories_burnt: number | null
          client_id: string
          created_at: string | null
          date: string
          id: string
          status: Database["public"]["Enums"]["workout_status"] | null
          updated_at: string | null
        }
        Insert: {
          calories_burnt?: number | null
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          status?: Database["public"]["Enums"]["workout_status"] | null
          updated_at?: string | null
        }
        Update: {
          calories_burnt?: number | null
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
      apply_referral_reward: {
        Args: { p_referral_id: string }
        Returns: boolean
      }
      calculate_referral_reward: {
        Args: {
          p_referee_plan: Database["public"]["Enums"]["platform_plan_type"]
          p_referrer_plan: Database["public"]["Enums"]["platform_plan_type"]
        }
        Returns: number
      }
      create_trainer_subscription: {
        Args: {
          p_is_trial_used: boolean
          p_plan_type: Database["public"]["Enums"]["platform_plan_type"]
          p_trainer_id: string
        }
        Returns: {
          amount: number | null
          created_at: string
          end_date: string
          grace_end_date: string | null
          id: string
          is_trial_used: boolean | null
          max_trial_clients: number | null
          payment_status: string | null
          plan_type: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id: string
          trial_clients_count: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trainer_platform_subscriptions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_trainer_subscription_webhook: {
        Args: {
          p_duration_days: number
          p_plan_type: Database["public"]["Enums"]["platform_plan_type"]
          p_razorpay_order_id: string
          p_razorpay_payment_id: string
          p_trainer_id: string
        }
        Returns: undefined
      }
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
      get_trainer_referral_stats: {
        Args: { p_trainer_id: string }
        Returns: {
          completed_referrals: number
          days_remaining: number
          pending_referrals: number
          total_days_earned: number
          total_referrals: number
        }[]
      }
      get_trainer_subscription_status: {
        Args: { _trainer_profile_id: string }
        Returns: {
          days_remaining: number
          end_date: string
          grace_end_date: string
          is_read_only: boolean
          plan_type: Database["public"]["Enums"]["platform_plan_type"]
          status: Database["public"]["Enums"]["platform_subscription_status"]
          subscription_id: string
        }[]
      }
      get_user_profile_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_active_platform_subscription: {
        Args: { _trainer_profile_id: string }
        Returns: boolean
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
      renew_trainer_subscription: {
        Args: {
          p_is_active: boolean
          p_plan_type: Database["public"]["Enums"]["platform_plan_type"]
          p_subscription_id: string
        }
        Returns: {
          amount: number | null
          created_at: string
          end_date: string
          grace_end_date: string | null
          id: string
          is_trial_used: boolean | null
          max_trial_clients: number | null
          payment_status: string | null
          plan_type: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id: string
          trial_clients_count: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trainer_platform_subscriptions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      renew_trainer_subscription_webhook: {
        Args: {
          p_duration_days: number
          p_plan_type: Database["public"]["Enums"]["platform_plan_type"]
          p_razorpay_order_id: string
          p_razorpay_payment_id: string
          p_subscription_id: string
        }
        Returns: undefined
      }
      start_trainer_trial: {
        Args: { p_trainer_id: string }
        Returns: {
          amount: number | null
          created_at: string
          end_date: string
          grace_end_date: string | null
          id: string
          is_trial_used: boolean | null
          max_trial_clients: number | null
          payment_status: string | null
          plan_type: Database["public"]["Enums"]["platform_plan_type"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["platform_subscription_status"]
          trainer_id: string
          trial_clients_count: number | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trainer_platform_subscriptions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_trainer_activity: {
        Args: { p_trainer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      billing_model: "prepaid" | "postpaid"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      platform_plan_type: "trial" | "monthly" | "annual"
      platform_subscription_status:
        | "trial"
        | "active"
        | "grace"
        | "expired"
        | "cancelled"
        | "pending_payment"
      service_type: "workout" | "nutrition" | "both"
      session_status:
        | "scheduled"
        | "completed"
        | "missed"
        | "cancelled"
        | "rescheduled"
      subscription_status: "active" | "pending_renewal" | "completed"
      training_plan_status:
        | "draft"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
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
      billing_model: ["prepaid", "postpaid"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      platform_plan_type: ["trial", "monthly", "annual"],
      platform_subscription_status: [
        "trial",
        "active",
        "grace",
        "expired",
        "cancelled",
        "pending_payment",
      ],
      service_type: ["workout", "nutrition", "both"],
      session_status: [
        "scheduled",
        "completed",
        "missed",
        "cancelled",
        "rescheduled",
      ],
      subscription_status: ["active", "pending_renewal", "completed"],
      training_plan_status: [
        "draft",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      user_role: ["trainer", "client"],
      workout_status: ["completed", "skipped", "pending"],
    },
  },
} as const
