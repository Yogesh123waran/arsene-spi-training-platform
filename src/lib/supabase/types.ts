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

/** Mirrors the public.app_role enum (0002_profiles_roles.sql). */
export type AppRoleColumn = "super_admin" | "trainer" | "student";

/**
 * Columns of public.profiles exactly as stored. `role` is the ONLY
 * production source of an application role — see
 * src/lib/auth/profile-role.ts.
 */
export type ProfilesRow = {
  id: string;
  role: AppRoleColumn;
  created_at: string;
  updated_at: string;
};

/**
 * End users have no INSERT/UPDATE privilege on profiles (RLS + grants
 * in 0002); these shapes exist for type completeness and for trusted
 * service-role code only.
 */
export type ProfilesInsert = {
  id: string;
  role?: AppRoleColumn;
  created_at?: string;
  updated_at?: string;
};

export type ProfilesUpdate = Partial<ProfilesInsert>;

// -------------------------------------------------------------------
// Core training model (0003_core_training_model.sql)
// -------------------------------------------------------------------

/** Mirrors the enums created in 0003_core_training_model.sql. */
export type PersonStatusColumn = "active" | "inactive" | "invited";
export type CourseLevelColumn = "foundation" | "intermediate" | "advanced";
export type CourseStatusColumn = "draft" | "published" | "archived";
export type BatchStatusColumn = "upcoming" | "ongoing" | "completed" | "cancelled";
export type EnrollmentStatusColumn = "enrolled" | "withdrawn" | "completed";

/**
 * public.trainers — id is the trainer's profiles.id (auth user id).
 * Only what other roles may see; contact data is in trainer_details.
 */
export type TrainersRow = {
  id: string;
  trainer_code: string;
  full_name: string;
  status: PersonStatusColumn;
  created_at: string;
  updated_at: string;
};

export type TrainersInsert = {
  id: string;
  trainer_code: string;
  full_name: string;
  status?: PersonStatusColumn;
  created_at?: string;
  updated_at?: string;
};

export type TrainersUpdate = Partial<TrainersInsert>;

/** public.trainer_details — readable only by super_admin and the trainer. */
export type TrainerDetailsRow = {
  trainer_id: string;
  email: string;
  phone: string | null;
  specializations: string[];
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainerDetailsInsert = {
  trainer_id: string;
  email: string;
  phone?: string | null;
  specializations?: string[];
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TrainerDetailsUpdate = Partial<TrainerDetailsInsert>;

/**
 * public.students — id is the student's profiles.id (auth user id).
 * Only what other roles may see; personal data is in student_details.
 */
export type StudentsRow = {
  id: string;
  student_code: string;
  full_name: string;
  status: PersonStatusColumn;
  created_at: string;
  updated_at: string;
};

export type StudentsInsert = {
  id: string;
  student_code: string;
  full_name: string;
  status?: PersonStatusColumn;
  created_at?: string;
  updated_at?: string;
};

export type StudentsUpdate = Partial<StudentsInsert>;

/** public.student_details — readable only by super_admin and the student. */
export type StudentDetailsRow = {
  student_id: string;
  email: string;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentDetailsInsert = {
  student_id: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  designation?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StudentDetailsUpdate = Partial<StudentDetailsInsert>;

export type CoursesRow = {
  id: string;
  course_code: string;
  title: string;
  description: string;
  level: CourseLevelColumn;
  duration_hours: number;
  status: CourseStatusColumn;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CoursesInsert = {
  id?: string;
  course_code: string;
  title: string;
  description?: string;
  level: CourseLevelColumn;
  duration_hours?: number;
  status?: CourseStatusColumn;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CoursesUpdate = Partial<CoursesInsert>;

export type ModulesRow = {
  id: string;
  course_id: string;
  module_code: string;
  title: string;
  description: string | null;
  sequence: number;
  duration_hours: number;
  created_at: string;
  updated_at: string;
};

export type ModulesInsert = {
  id?: string;
  course_id: string;
  module_code: string;
  title: string;
  description?: string | null;
  sequence: number;
  duration_hours?: number;
  created_at?: string;
  updated_at?: string;
};

export type ModulesUpdate = Partial<ModulesInsert>;

export type BatchesRow = {
  id: string;
  batch_code: string;
  course_id: string;
  trainer_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  status: BatchStatusColumn;
  max_seats: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BatchesInsert = {
  id?: string;
  batch_code: string;
  course_id: string;
  trainer_id?: string | null;
  name: string;
  start_date: string;
  end_date: string;
  status?: BatchStatusColumn;
  max_seats: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BatchesUpdate = Partial<BatchesInsert>;

export type BatchStudentsRow = {
  batch_id: string;
  student_id: string;
  enrollment_status: EnrollmentStatusColumn;
  enrolled_at: string;
  completed_at: string | null;
  enrolled_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BatchStudentsInsert = {
  batch_id: string;
  student_id: string;
  enrollment_status?: EnrollmentStatusColumn;
  enrolled_at?: string;
  completed_at?: string | null;
  enrolled_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BatchStudentsUpdate = Partial<BatchStudentsInsert>;

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: ClassesRow;
        Insert: ClassesInsert;
        Update: ClassesUpdate;
        Relationships: [
          {
            foreignKeyName: "classes_course_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_batch_fk";
            columns: ["batch_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id", "course_id"];
          },
          {
            foreignKeyName: "classes_module_fk";
            columns: ["module_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id", "course_id"];
          },
          {
            foreignKeyName: "classes_trainer_fk";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: ProfilesRow;
        Insert: ProfilesInsert;
        Update: ProfilesUpdate;
        Relationships: [];
      };
      trainers: {
        Row: TrainersRow;
        Insert: TrainersInsert;
        Update: TrainersUpdate;
        Relationships: [
          {
            foreignKeyName: "trainers_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trainer_details: {
        Row: TrainerDetailsRow;
        Insert: TrainerDetailsInsert;
        Update: TrainerDetailsUpdate;
        Relationships: [
          {
            foreignKeyName: "trainer_details_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: true;
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: StudentsRow;
        Insert: StudentsInsert;
        Update: StudentsUpdate;
        Relationships: [
          {
            foreignKeyName: "students_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_details: {
        Row: StudentDetailsRow;
        Insert: StudentDetailsInsert;
        Update: StudentDetailsUpdate;
        Relationships: [
          {
            foreignKeyName: "student_details_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: CoursesRow;
        Insert: CoursesInsert;
        Update: CoursesUpdate;
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: ModulesRow;
        Insert: ModulesInsert;
        Update: ModulesUpdate;
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      batches: {
        Row: BatchesRow;
        Insert: BatchesInsert;
        Update: BatchesUpdate;
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      batch_students: {
        Row: BatchStudentsRow;
        Insert: BatchStudentsInsert;
        Update: BatchStudentsUpdate;
        Relationships: [
          {
            foreignKeyName: "batch_students_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_students_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_students_enrolled_by_fkey";
            columns: ["enrolled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      /**
       * Caller's role from public.profiles, or NULL (no user / no
       * profile). Defined in 0001, replaced in 0002_profiles_roles.sql.
       */
      current_app_role: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      /** RLS helpers (0003). Each answers a question about the caller only. */
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_batch_trainer: {
        Args: { p_batch_id: string };
        Returns: boolean;
      };
      is_enrolled_in_batch: {
        Args: { p_batch_id: string };
        Returns: boolean;
      };
      is_class_trainer_in_batch: {
        Args: { p_batch_id: string };
        Returns: boolean;
      };
      can_read_course: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
      student_can_read_trainer: {
        Args: { p_trainer_id: string };
        Returns: boolean;
      };
      trainer_can_read_student: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRoleColumn;
      person_status: PersonStatusColumn;
      course_level: CourseLevelColumn;
      course_status: CourseStatusColumn;
      batch_status: BatchStatusColumn;
      enrollment_status: EnrollmentStatusColumn;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
