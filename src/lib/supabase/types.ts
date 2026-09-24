/**
 * Supabase database types.
 *
 * This file will eventually be replaced wholesale by the generated
 * output of:
 *
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 *
 * Until then it is maintained by hand, matching the EXACT shape that
 * generator emits (a `type` alias — not an `interface` — with
 * `Database["public"]["Tables"][T]["Row" | "Insert" | "Update"]`,
 * `{ [_ in never]: never }` for empty sections, and `Relationships`
 * as a plain array). Matching the generated shape precisely matters:
 * @supabase/supabase-js's `.from()` overloads resolve through a
 * chain of default generic parameters (SchemaName, then Schema)
 * that are sensitive to this exact structure — see the note above
 * ClassesRow below for what broke when it didn't match.
 *
 * Each table here must stay in sync with its migration under
 * `supabase/migrations/`. Tables that have no migration yet are
 * deliberately absent rather than guessed at.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Mirrors the CHECK constraints on public.classes (0001_classes.sql). */
export type ClassStatusColumn = "scheduled" | "live" | "completed" | "cancelled";
export type ClassTypeColumn = "online" | "offline" | "hybrid";

/**
 * Columns of public.classes exactly as stored.
 * Nullable columns are `| null`, matching the migration.
 */
export type ClassesRow = {
  id: string;
  course_id: string;
  module_id: string | null;
  batch_id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  class_date: string;
  start_time: string;
  end_time: string;
  teams_meeting_url: string | null;
  status: ClassStatusColumn;
  class_type: ClassTypeColumn;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Insert shape: columns with a DB default (id, created_at,
 * updated_at, status, class_type) are optional; nullable columns
 * accept null; everything else is required.
 */
export type ClassesInsert = {
  id?: string;
  course_id: string;
  module_id?: string | null;
  batch_id: string;
  trainer_id: string;
  title: string;
  description?: string | null;
  class_date: string;
  start_time: string;
  end_time: string;
  teams_meeting_url?: string | null;
  status?: ClassStatusColumn;
  class_type?: ClassTypeColumn;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Update shape: every column optional (partial patch). */
export type ClassesUpdate = Partial<ClassesInsert>;

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: ClassesRow;
        Insert: ClassesInsert;
        Update: ClassesUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      /** Helper used by the classes RLS policies (0001_classes.sql). Takes no arguments. */
      current_app_role: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
