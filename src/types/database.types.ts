// Généré via : npx supabase gen types typescript --project-id TON_PROJECT_ID > src/types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          specialty:
            | "psychologue"
            | "osteopathe"
            | "kinesitherapeute"
            | "autre"
            | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          specialty?:
            | "psychologue"
            | "osteopathe"
            | "kinesitherapeute"
            | "autre"
            | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          specialty?:
            | "psychologue"
            | "osteopathe"
            | "kinesitherapeute"
            | "autre"
            | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          therapist_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          birthdate: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          birthdate?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          therapist_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          birthdate?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patients_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          therapist_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status: "confirmed" | "cancelled" | "completed" | "no_show";
          notes: string | null;
          price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          patient_id: string;
          start_time: string;
          end_time: string;
          status?: "confirmed" | "cancelled" | "completed" | "no_show";
          notes?: string | null;
          price?: number | null;
          created_at?: string;
        };
        Update: {
          patient_id?: string;
          start_time?: string;
          end_time?: string;
          status?: "confirmed" | "cancelled" | "completed" | "no_show";
          notes?: string | null;
          price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          therapist_id: string;
          patient_id: string;
          appointment_id: string | null;
          amount: number;
          status: "draft" | "sent" | "paid";
          invoice_number: string;
          issued_at: string;
          paid_at: string | null;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          patient_id: string;
          appointment_id?: string | null;
          amount: number;
          status?: "draft" | "sent" | "paid";
          invoice_number: string;
          issued_at?: string;
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          status?: "draft" | "sent" | "paid";
          paid_at?: string | null;
          pdf_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_therapist_id_fkey";
            columns: ["therapist_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          therapist_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "pro";
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          therapist_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: string;
          current_period_end?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Helpers de types extraits ────────────────────────────────────────────────

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
