export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  courseId: string;
  moduleId?: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  prompt: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  marks: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
