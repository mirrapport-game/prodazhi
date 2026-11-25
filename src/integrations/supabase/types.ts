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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_owner: {
        Row: {
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_sources: {
        Row: {
          added_at: string
          chat_id: number
          source: string
          title: string | null
          type: string | null
        }
        Insert: {
          added_at?: string
          chat_id: number
          source?: string
          title?: string | null
          type?: string | null
        }
        Update: {
          added_at?: string
          chat_id?: number
          source?: string
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      crm_cabinets: {
        Row: {
          created_at: string
          id: string
          name: string
          purpose: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          purpose?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purpose?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          audience_id: string | null
          cabinet: string | null
          created_at: string
          id: string
          last_contact_at: string
          last_message: string | null
          name: string
          note: string | null
          phone: string | null
          source: string
          stage: string
          telegram_id: number | null
          username: string | null
          vk_group_id: number | null
          vk_user_id: number | null
        }
        Insert: {
          audience_id?: string | null
          cabinet?: string | null
          created_at?: string
          id?: string
          last_contact_at?: string
          last_message?: string | null
          name: string
          note?: string | null
          phone?: string | null
          source?: string
          stage?: string
          telegram_id?: number | null
          username?: string | null
          vk_group_id?: number | null
          vk_user_id?: number | null
        }
        Update: {
          audience_id?: string | null
          cabinet?: string | null
          created_at?: string
          id?: string
          last_contact_at?: string
          last_message?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          source?: string
          stage?: string
          telegram_id?: number | null
          username?: string | null
          vk_group_id?: number | null
          vk_user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "crm_cabinets"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_events: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          kind: string
          text: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          kind: string
          text?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          kind?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          date: string
          id: string
          prepare: string | null
          raw_text: string | null
          status: string
          time: string | null
          topic: string | null
          user_id: number | null
          with_whom: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          prepare?: string | null
          raw_text?: string | null
          status?: string
          time?: string | null
          topic?: string | null
          user_id?: number | null
          with_whom?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          prepare?: string | null
          raw_text?: string | null
          status?: string
          time?: string | null
          topic?: string | null
          user_id?: number | null
          with_whom?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          category: string
          chat_id: number
          chat_title: string | null
          chat_type: string | null
          created_at: string
          id: string
          message_link: string | null
          processed: boolean
          sender_id: number | null
          sender_name: string | null
          source: string
          text: string | null
        }
        Insert: {
          category?: string
          chat_id: number
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          message_link?: string | null
          processed?: boolean
          sender_id?: number | null
          sender_name?: string | null
          source?: string
          text?: string | null
        }
        Update: {
          category?: string
          chat_id?: number
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          message_link?: string | null
          processed?: boolean
          sender_id?: number | null
          sender_name?: string | null
          source?: string
          text?: string | null
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          id: string
          ref_id: string
          sent_at: string
          type: string
        }
        Insert: {
          id?: string
          ref_id: string
          sent_at?: string
          type: string
        }
        Update: {
          id?: string
          ref_id?: string
          sent_at?: string
          type?: string
        }
        Relationships: []
      }
      telegram_updates: {
        Row: {
          received_at: string
          update_id: number
        }
        Insert: {
          received_at?: string
          update_id: number
        }
        Update: {
          received_at?: string
          update_id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          pending_edit_meeting: string | null
          telegram_id: number
        }
        Insert: {
          created_at?: string
          pending_edit_meeting?: string | null
          telegram_id: number
        }
        Update: {
          created_at?: string
          pending_edit_meeting?: string | null
          telegram_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_owner: { Args: never; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
