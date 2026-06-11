export interface ScoreComponents {
  participation: number; // max 10
  homework: number;      // max 10
  mcq: number;           // max 30
  project: number;       // max 30
  lab: number;           // max 20
}

export type ComponentKey = keyof ScoreComponents;

export interface AfterSupportStatus {
  participation: string; // e.g., "Achieved", "Developing", "Ongoing Support"
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
  grade: string; // Acts as "Class" (e.g. Class 3A, Class 3B, Class 4A, Class 4B, Class 5A, Class 5B)
  phase: string; // "Phase 1" | "Phase 2" | "Phase 3" | "Phase 4"
  rollNo?: string; // Roll number of the student
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
    name: "Classroom Participation & Attentiveness",
    description: "Assessment of student engagement, focus, asking/answering questions, and following lab safety policies.",
    maxScore: 10
  },
  homework: {
    name: "Homework & Independent Assignments",
    description: "Timeliness, completeness, accuracy, and dedication shown in out-of-class computer practice sheets.",
    maxScore: 10
  },
  mcq: {
    name: "Theoretical Assessment (MCQ & Concepts)",
    description: "Evaluates concepts retention, understanding of computer parts, cyber wellness, and computational thinking theory.",
    maxScore: 30
  },
  project: {
    name: "Creative Programming & Practical Projects",
    description: "Measures hands-on building, script design, algorithm execution, project organization, and presentation.",
    maxScore: 30
  },
  lab: {
    name: "Practical Lab Deliverables",
    description: "Execution of in-class coding exercises, typing speed, file structures understanding, and hardware interactions.",
    maxScore: 20
  }
};
