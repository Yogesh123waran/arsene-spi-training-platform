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

// -------------------------------------------------------------------
// Class attendance (0005_class_attendance.sql)
// -------------------------------------------------------------------

/** Mirrors the public.attendance_status enum. */
export type AttendanceStatusColumn = "present" | "absent" | "late" | "excused";

/** public.class_attendance — one student's attendance for one class. */
export type ClassAttendanceRow = {
  class_id: string;
  student_id: string;
  batch_id: string;
  status: AttendanceStatusColumn;
  remarks: string | null;
  marked_by: string;
  marked_at: string;
  created_at: string;
  updated_at: string;
};

/**
 * marked_by / marked_at are always set by the database
 * (class_attendance_stamp) and are deliberately not insertable from the
 * client; created_at / updated_at are database-managed too.
 */
export type ClassAttendanceInsert = {
  class_id: string;
  student_id: string;
  batch_id: string;
  status: AttendanceStatusColumn;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClassAttendanceUpdate = Partial<ClassAttendanceInsert>;

// -------------------------------------------------------------------
// Assignments (0006_assignments.sql)
// -------------------------------------------------------------------

/** Mirrors the public.assignment_status / submission_status enums. */
export type AssignmentStatusColumn = "draft" | "published" | "closed";
export type SubmissionStatusColumn = "submitted" | "returned";

export type ClassAssignmentsRow = {
  id: string;
  class_id: string;
  batch_id: string;
  title: string;
  instructions: string | null;
  resource_url: string | null;
  due_at: string | null;
  max_score: number | null;
  status: AssignmentStatusColumn;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * created_by / updated_by / created_at / updated_at are stamped by the
 * database (class_assignments_stamp) and are deliberately not
 * insertable from the client.
 */
export type ClassAssignmentsInsert = {
  id?: string;
  class_id: string;
  batch_id: string;
  title: string;
  instructions?: string | null;
  resource_url?: string | null;
  due_at?: string | null;
  max_score?: number | null;
  status?: AssignmentStatusColumn;
};

export type ClassAssignmentsUpdate = Partial<ClassAssignmentsInsert>;

export type AssignmentSubmissionsRow = {
  assignment_id: string;
  student_id: string;
  batch_id: string;
  submission_url: string;
  note: string | null;
  status: SubmissionStatusColumn;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * submitted_at / reviewed_by / reviewed_at / created_at / updated_at are
 * stamped by the database (assignment_submissions_guard) and are
 * deliberately not insertable from the client. status/score/feedback
 * are review fields: the guard forces them on insert and only honours
 * them from trainers/admins on update.
 */
export type AssignmentSubmissionsInsert = {
  assignment_id: string;
  student_id: string;
  batch_id: string;
  submission_url: string;
  note?: string | null;
  status?: SubmissionStatusColumn;
  score?: number | null;
  feedback?: string | null;
};

export type AssignmentSubmissionsUpdate = Partial<AssignmentSubmissionsInsert>;

// -------------------------------------------------------------------
// Question bank (0007_question_bank.sql)
// -------------------------------------------------------------------

/** Mirrors the public.question_type / question_status enums. */
export type QuestionTypeColumn = "single_choice" | "multiple_choice" | "true_false";
export type QuestionStatusColumn = "draft" | "active" | "archived";

export type QuestionsRow = {
  id: string;
  course_id: string;
  module_id: string | null;
  question_text: string;
  question_type: QuestionTypeColumn;
  marks: number;
  status: QuestionStatusColumn;
  explanation: string | null;
  revision: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * Authenticated users have NO insert/update privilege on questions or
 * question_options: every write goes through the save_question /
 * set_question_status database functions (see Functions below), and
 * created_by / updated_by / revision / timestamps are stamped by the
 * database. These shapes exist only to satisfy the Database type.
 */
export type QuestionsInsert = {
  id?: string;
  course_id: string;
  module_id?: string | null;
  question_text: string;
  question_type: QuestionTypeColumn;
  marks: number;
  status?: QuestionStatusColumn;
  explanation?: string | null;
};

export type QuestionsUpdate = Partial<QuestionsInsert>;

/** is_correct is the answer key — staff-only (no student RLS policy). */
export type QuestionOptionsRow = {
  id: string;
  question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

export type QuestionOptionsInsert = {
  id?: string;
  question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

export type QuestionOptionsUpdate = Partial<QuestionOptionsInsert>;

// -------------------------------------------------------------------
// Class tests (0008_tests.sql)
// -------------------------------------------------------------------

/** Mirrors the public.test_type / test_status enums. */
export type TestTypeColumn = "quiz" | "module_test" | "final_exam" | "practical";
export type TestStatusColumn = "draft" | "scheduled" | "active" | "closed";

export type TestsRow = {
  id: string;
  class_id: string;
  batch_id: string;
  test_type: TestTypeColumn;
  title: string;
  instructions: string | null;
  status: TestStatusColumn;
  pass_mark_percent: number | null;
  time_limit_minutes: number | null;
  attempt_limit: number;
  available_from: string | null;
  available_until: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

/**
 * created_by / updated_by / created_at / updated_at are stamped by the
 * database (tests_stamp) and are deliberately not insertable from the
 * client. status is validated and normalised by tests_validate.
 */
export type TestsInsert = {
  id?: string;
  class_id: string;
  batch_id: string;
  test_type: TestTypeColumn;
  title: string;
  instructions?: string | null;
  status?: TestStatusColumn;
  pass_mark_percent?: number | null;
  time_limit_minutes?: number | null;
  attempt_limit?: number;
  available_from?: string | null;
  available_until?: string | null;
};

export type TestsUpdate = Partial<TestsInsert>;

/**
 * Frozen question copy. Authenticated users have SELECT only (staff,
 * via RLS); rows are written only by add_test_questions /
 * remove_test_question. The Insert shapes exist only to satisfy the
 * Database type.
 */
export type TestQuestionsRow = {
  id: string;
  test_id: string;
  position: number;
  source_question_id: string;
  source_revision: number;
  question_text: string;
  question_type: QuestionTypeColumn;
  marks: number;
  explanation: string | null;
  added_by: string;
  added_at: string;
};

export type TestQuestionsInsert = {
  id?: string;
  test_id: string;
  position: number;
  source_question_id: string;
  source_revision: number;
  question_text: string;
  question_type: QuestionTypeColumn;
  marks: number;
  explanation?: string | null;
};

export type TestQuestionsUpdate = Partial<TestQuestionsInsert>;

/** is_correct is the frozen answer key — staff-only (no student RLS policy). */
export type TestQuestionOptionsRow = {
  id: string;
  test_question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

export type TestQuestionOptionsInsert = {
  id?: string;
  test_question_id: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

export type TestQuestionOptionsUpdate = Partial<TestQuestionOptionsInsert>;

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
      class_attendance: {
        Row: ClassAttendanceRow;
        Insert: ClassAttendanceInsert;
        Update: ClassAttendanceUpdate;
        Relationships: [
          {
            foreignKeyName: "class_attendance_class_batch_fk";
            columns: ["class_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "batch_id"];
          },
          {
            foreignKeyName: "class_attendance_enrolment_fk";
            columns: ["batch_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "batch_students";
            referencedColumns: ["batch_id", "student_id"];
          },
          {
            foreignKeyName: "class_attendance_student_fk";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_attendance_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      class_assignments: {
        Row: ClassAssignmentsRow;
        Insert: ClassAssignmentsInsert;
        Update: ClassAssignmentsUpdate;
        Relationships: [
          {
            foreignKeyName: "class_assignments_class_batch_fk";
            columns: ["class_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "batch_id"];
          },
          {
            foreignKeyName: "class_assignments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_assignments_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_submissions: {
        Row: AssignmentSubmissionsRow;
        Insert: AssignmentSubmissionsInsert;
        Update: AssignmentSubmissionsUpdate;
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_batch_fk";
            columns: ["assignment_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "class_assignments";
            referencedColumns: ["id", "batch_id"];
          },
          {
            foreignKeyName: "assignment_submissions_enrolment_fk";
            columns: ["batch_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "batch_students";
            referencedColumns: ["batch_id", "student_id"];
          },
          {
            foreignKeyName: "assignment_submissions_student_fk";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: QuestionsRow;
        Insert: QuestionsInsert;
        Update: QuestionsUpdate;
        Relationships: [
          {
            foreignKeyName: "questions_course_fk";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_module_course_fk";
            columns: ["module_id", "course_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id", "course_id"];
          },
          {
            foreignKeyName: "questions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      question_options: {
        Row: QuestionOptionsRow;
        Insert: QuestionOptionsInsert;
        Update: QuestionOptionsUpdate;
        Relationships: [
          {
            foreignKeyName: "question_options_question_fk";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      tests: {
        Row: TestsRow;
        Insert: TestsInsert;
        Update: TestsUpdate;
        Relationships: [
          {
            foreignKeyName: "tests_class_batch_fk";
            columns: ["class_id", "batch_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "batch_id"];
          },
          {
            foreignKeyName: "tests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tests_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      test_questions: {
        Row: TestQuestionsRow;
        Insert: TestQuestionsInsert;
        Update: TestQuestionsUpdate;
        Relationships: [
          {
            foreignKeyName: "test_questions_test_fk";
            columns: ["test_id"];
            isOneToOne: false;
            referencedRelation: "tests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_questions_source_fk";
            columns: ["source_question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_questions_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      test_question_options: {
        Row: TestQuestionOptionsRow;
        Insert: TestQuestionOptionsInsert;
        Update: TestQuestionOptionsUpdate;
        Relationships: [
          {
            foreignKeyName: "test_question_options_question_fk";
            columns: ["test_question_id"];
            isOneToOne: false;
            referencedRelation: "test_questions";
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
      /** RLS helpers (0005). Each answers a question about the caller only. */
      is_class_trainer: {
        Args: { p_class_id: string };
        Returns: boolean;
      };
      owns_student_record: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
      /** Question bank (0007). Caller is a CURRENT trainer (upcoming/ongoing batch) of the course. */
      is_course_trainer: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
      /** Atomic create/update of a question + all its options; returns the question id. */
      save_question: {
        Args: { payload: Json };
        Returns: string;
      };
      set_question_status: {
        Args: { p_question_id: string; p_status: QuestionStatusColumn };
        Returns: undefined;
      };
      /** Class tests (0008). Caller is the CURRENT trainer (upcoming/ongoing) of the batch. */
      is_current_batch_trainer: {
        Args: { p_batch_id: string };
        Returns: boolean;
      };
      test_effective_status: {
        Args: { p_status: TestStatusColumn; p_available_from: string | null; p_available_until: string | null };
        Returns: TestStatusColumn;
      };
      /** Copies active bank questions (server-side) into a draft test; returns how many were added. */
      add_test_questions: {
        Args: { p_test_id: string; p_question_ids: string[] };
        Returns: number;
      };
      remove_test_question: {
        Args: { p_test_question_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRoleColumn;
      person_status: PersonStatusColumn;
      course_level: CourseLevelColumn;
      course_status: CourseStatusColumn;
      batch_status: BatchStatusColumn;
      enrollment_status: EnrollmentStatusColumn;
      attendance_status: AttendanceStatusColumn;
      assignment_status: AssignmentStatusColumn;
      submission_status: SubmissionStatusColumn;
      question_type: QuestionTypeColumn;
      question_status: QuestionStatusColumn;
      test_type: TestTypeColumn;
      test_status: TestStatusColumn;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
