export interface ScoreComponents {
  participation: number; // max 10
  homework: number;      // max 10
  mcq: number;           // max 30
  project: number;       // max 30
  lab: number;           // max 20
}

export type ComponentKey = keyof ScoreComponents;

export interface AfterSupportStatus {
  participation: string; // e.g., "Excellent", "Very Good", "Good", "Needs Improvement"
  homework: string;
  mcq: string;
  project: string;
  lab: string;
}

export interface TeacherRemarks {
  participation: string;
  homework: string;
  mcq: string;
  project: string;
  lab: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  grade: string; // Acts as "Class" (e.g. Class 3A, Class 3B)
  phase: string; // "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4"
  rollNo?: string; // Roll number of the student
  batch?: string; // Academic batch for the student (e.g. "2083 BS")
  date: string;
  evaluator: string;
  scores: ScoreComponents;
  afterSupport: AfterSupportStatus;
  remarks: TeacherRemarks;
  strengths: string;
  areasOfImprovement: string;
}

export type RatingLabel = "Excellent" | "Good" | "Satisfactory" | "Needs Improvement";

export interface ComponentInfo {
  name: string;
  description: string;
  maxScore: number;
}

export const COMPONENT_DETAILS: Record<ComponentKey, ComponentInfo> = {
  participation: {
    name: "Class Participation and Attentiveness",
    description: "Measures the student’s participation in classroom activities, attentiveness during lessons, willingness to ask and answer questions, and ability to follow classroom expectations.",
    maxScore: 10
  },
  homework: {
    name: "Homework and Independent Practice",
    description: "Evaluates the regular completion of homework, effort shown in assigned tasks, and responsibility in completing work independently.",
    maxScore: 10
  },
  mcq: {
    name: "Computer Concepts and Assessment",
    description: "Assesses the student’s understanding of computer concepts through tests, MCQs, quizzes, discussions, and other classroom assessments.",
    maxScore: 30
  },
  project: {
    name: "Creative Work and Projects",
    description: "Measures the student’s creativity, ability to apply learned skills, completion of assigned projects, and presentation of ideas through computer-based activities.",
    maxScore: 30
  },
  lab: {
    name: "Practical Lab Performance",
    description: "Evaluates participation and performance during computer lab sessions, including the use of digital tools, completion of practical activities, and demonstration of computer skills.",
    maxScore: 20
  }
};
