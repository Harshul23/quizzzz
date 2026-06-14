export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // 0 means untimed
  questions: Question[];
  createdAt: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

export interface Answer {
  questionId: string;
  selectedOptionIndex: number;
}

export interface Submission {
  id: string;
  examId: string;
  studentName: string;
  studentEmail: string;
  answers: Answer[];
  score: number; // total points obtained
  totalPoints: number; // max points
  percentage: number; // score / totalPoints * 100
  timeSpentSeconds: number;
  submittedAt: string;
  automatedGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  isSyncedToSheet?: boolean;
}

export interface StudentAnalytics {
  averageScorePercent: number;
  completionRate: number;
  averageTimeSeconds: number;
  gradeDistribution: { grade: string; count: number }[];
  scoreSpectrum: { min: number; max: number; average: number };
}
