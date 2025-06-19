export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          company_name: string
          company_url: string | null
          created_at: string
          created_by: string
          currency: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          company_url?: string | null
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_url?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          archived: boolean
          client_id: string
          created_at: string
          created_by: string
          hourly_rate: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          client_id: string
          created_at?: string
          created_by: string
          hourly_rate: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          hourly_rate?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          archived: boolean
          birth_date: string | null
          comments: string | null
          country_of_residence: string | null
          created_at: string
          created_by: string
          direct_manager_id: string | null
          end_date: string | null
          group_name: string | null
          id: string
          job_title: string | null
          payment_amount: number | null
          personal_email: string | null
          seniority: string | null
          start_date: string | null
          updated_at: string
          worker_full_name: string
          worker_id: number
        }
        Insert: {
          archived?: boolean
          birth_date?: string | null
          comments?: string | null
          country_of_residence?: string | null
          created_at?: string
          created_by: string
          direct_manager_id?: string | null
          end_date?: string | null
          group_name?: string | null
          id?: string
          job_title?: string | null
          payment_amount?: number | null
          personal_email?: string | null
          seniority?: string | null
          start_date?: string | null
          updated_at?: string
          worker_full_name: string
          worker_id?: number
        }
        Update: {
          archived?: boolean
          birth_date?: string | null
          comments?: string | null
          country_of_residence?: string | null
          created_at?: string
          created_by?: string
          direct_manager_id?: string | null
          end_date?: string | null
          group_name?: string | null
          id?: string
          job_title?: string | null
          payment_amount?: number | null
          personal_email?: string | null
          seniority?: string | null
          start_date?: string | null
          updated_at?: string
          worker_full_name?: string
          worker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "employees_direct_manager_id_fkey"
            columns: ["direct_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          archived: boolean
          client_id: string
          created_at: string
          created_by: string
          date: string
          description: string | null
          id: string
          is_recurring: boolean
          payment_receiver_id: string
          recurring_end_date: string | null
          recurring_frequency: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          archived?: boolean
          client_id: string
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          payment_receiver_id: string
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          archived?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          payment_receiver_id?: string
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_payment_receiver_id_fkey"
            columns: ["payment_receiver_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_sources: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          details: Json | null
          id: string
          name: string
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by: string
          details?: Json | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          details?: Json | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          created_at: string
          generated_date: string
          id: string
          next_due_date: string
          source_id: string
          source_table: string
        }
        Insert: {
          created_at?: string
          generated_date: string
          id?: string
          next_due_date: string
          source_id: string
          source_table: string
        }
        Update: {
          created_at?: string
          generated_date?: string
          id?: string
          next_due_date?: string
          source_id?: string
          source_table?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      spending: {
        Row: {
          amount: number
          archived: boolean
          category_id: string
          created_at: string
          created_by: string
          date: string
          description: string | null
          developer_id: string | null
          employee_id: string | null
          id: string
          is_recurring: boolean
          notes: string | null
          payment_receiver_id: string | null
          reconciled: boolean
          recurring_end_date: string | null
          recurring_frequency: string | null
          subscription_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          archived?: boolean
          category_id: string
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          developer_id?: string | null
          employee_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          payment_receiver_id?: string | null
          reconciled?: boolean
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          subscription_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          archived?: boolean
          category_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          developer_id?: string | null
          employee_id?: string | null
          id?: string
          is_recurring?: boolean
          notes?: string | null
          payment_receiver_id?: string | null
          reconciled?: boolean
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          subscription_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spending_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_payment_receiver_id_fkey"
            columns: ["payment_receiver_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spending_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          archived: boolean
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          category_id: string | null
          client_card_info: Json | null
          created_at: string
          created_by: string
          id: string
          name: string
          next_due_date: string
          payment_receiver_id: string | null
          recurring_end_date: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          archived?: boolean
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          category_id?: string | null
          client_card_info?: Json | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          next_due_date: string
          payment_receiver_id?: string | null
          recurring_end_date?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          archived?: boolean
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          category_id?: string | null
          client_card_info?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          next_due_date?: string
          payment_receiver_id?: string | null
          recurring_end_date?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_receiver_id_fkey"
            columns: ["payment_receiver_id"]
            isOneToOne: false
            referencedRelation: "payment_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          account_id: string
          action: string
          created_at: string | null
          created_by: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          action: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          action?: string
          created_at?: string | null
          created_by?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          account_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_resent_at: string | null
          message: string | null
          resent_count: number | null
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          account_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          last_resent_at?: string | null
          message?: string | null
          resent_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          account_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_resent_at?: string | null
          message?: string | null
          resent_count?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          granted: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_id: string
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          language: string | null
          last_login_at: string | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id?: string
          language?: string | null
          last_login_at?: string | null
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          language?: string | null
          last_login_at?: string | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          id: string
          name: string
          service_type: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by: string
          id?: string
          name: string
          service_type?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          service_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_account_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_name: string
          granted: boolean
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      log_user_activity: {
        Args: {
          p_user_id: string
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      billing_cycle: "monthly" | "yearly"
      payment_type: "income" | "expense"
      user_role: "super_admin" | "admin" | "manager" | "user" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_cycle: ["monthly", "yearly"],
      payment_type: ["income", "expense"],
      user_role: ["super_admin", "admin", "manager", "user", "viewer"],
    },
  },
} as const
