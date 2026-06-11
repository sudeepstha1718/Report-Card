import * as XLSX from "xlsx";
import { StudentRecord, COMPONENT_DETAILS, ComponentKey } from "../types";

/**
 * Calculates percentage score for a given raw score and max score.
 */
export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

/**
 * Converts a percentage into the 1-4 standard rating.
 * Rating bands:
 * - 4: 90% and above (Excellent)
 * - 3: 70% – 89% (Good)
 * - 2: 50% – 69% (Satisfactory)
 * - 1: Below 50% (Needs Improvement)
 */
/**
 * Converts a percentage into the 1-4 standard rating.
 * Rating bands:
 * - 4: 90% and above (Excellent)
 * - 3: 70% – 89% (Very Good)
 * - 2: 50% – 69% (Satisfactory)
 * - 1: Below 50% (Needs Improvement)
 */
export function percentageToRating(percentage: number): 1 | 2 | 3 | 4 {
  if (percentage >= 90) return 4;
  if (percentage >= 70) return 3;
  if (percentage >= 50) return 2;
  return 1;
}

/**
 * Map ratings to parent-friendly qualitative descriptors.
 */
export function ratingToDescriptor(rating: 1 | 2 | 3 | 4): string {
  switch (rating) {
    case 4: return "Excellent";
    case 3: return "Very Good";
    case 2: return "Satisfactory";
    case 1: return "Needs Improvement";
  }
}

/**
 * Map ratings to parent-friendly short explanation.
 */
export function scoreToBriefDescriptor(score: number, maxScore: number): string {
  const percentage = calculatePercentage(score, maxScore);
  const rating = percentageToRating(percentage);
  return ratingToDescriptor(rating);
}

/**
 * Calculates the overall total score (out of 100) for a student record's component raw scores.
 */
export function calculateTotalScore(records: StudentRecord["scores"]): number {
  return (
    (records.participation || 0) +
    (records.homework || 0) +
    (records.mcq || 0) +
    (records.project || 0) +
    (records.lab || 0)
  );
}

/**
 * Maps double total percentage of 100 to standard letter grade.
 */
export function percentageToLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 35) return "D";
  return "NG";
}

/**
 * Auto-creates pre-filled mock remarks/placeholder remarks for components.
 */
export function generateDefaultRemarks(components: StudentRecord["scores"]): Record<ComponentKey, string> {
  const remarks: Record<ComponentKey, string> = {
    participation: "",
    homework: "",
    mcq: "",
    project: "",
    lab: ""
  };

  (Object.keys(COMPONENT_DETAILS) as ComponentKey[]).forEach((key) => {
    const score = components[key] || 0;
    const max = COMPONENT_DETAILS[key].maxScore;
    const pct = calculatePercentage(score, max);
    let desc = "";

    if (pct >= 90) {
      desc = "Highly attentive, answers computing questions eagerly, and leads teamwork during hands-on practice.";
    } else if (pct >= 70) {
      desc = "Consistent, completes tasks correctly, and demonstrates positive focus during lab workouts.";
    } else if (pct >= 50) {
      desc = "Maintains average attention in class, needs minor prompting to complete computer assignments.";
    } else {
      desc = "Struggles with concept focus or setup speed, requires regular teacher assistance and review.";
    }
    remarks[key] = desc;
  });

  return remarks;
}

/**
 * Triggers spreadsheet download (.xlsx format) with formatted student grades, calculation formulas, and instructions.
 */
export function exportToClassroomExcel(students: StudentRecord[]) {
  // 1. Prepare raw data rows
  const dataRows = students.map((student) => {
    const total = calculateTotalScore(student.scores);
    const overallRating = percentageToRating(total);
    const overallDesc = ratingToDescriptor(overallRating);
    const letterGrade = percentageToLetterGrade(total);

    return {
      "Student ID": student.id,
      "Student Name": student.name,
      "Roll Number": student.rollNo || "—",
      "Grade/Section": student.grade,
      "Date Evaluated": student.date,
      "Classroom Participation (10)": student.scores.participation,
      "Homework Tasks (10)": student.scores.homework,
      "Theory MCQ (30)": student.scores.mcq,
      "Practical Projects (30)": student.scores.project,
      "Practical Lab (20)": student.scores.lab,
      "Total Marks (100)": total,
      "Overall Rating (1-4)": overallRating,
      "Qualitative Descriptor": overallDesc,
      "Overall Grade": letterGrade,
      "Key Strengths": student.strengths || "N/A",
      "Areas of Improvement": student.areasOfImprovement || "N/A",
    };
  });

  // 2. Create Sheet JS Objects
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Master Gradebook Ledger
  const wsMaster = XLSX.utils.json_to_sheet(dataRows);
  
  // Apply clean width constraints for better Excel viewing
  const wscols = [
    { wch: 12 }, // ID // width in chars
    { wch: 25 }, // Name
    { wch: 15 }, // Roll Number
    { wch: 14 }, // Grade
    { wch: 15 }, // Date
    { wch: 28 }, // Participation
    { wch: 22 }, // Homework
    { wch: 18 }, // MCQ
    { wch: 25 }, // Project
    { wch: 20 }, // Lab
    { wch: 18 }, // Total
    { wch: 22 }, // Converted Rating
    { wch: 22 }, // Descriptor
    { wch: 15 }, // Grade letter
    { wch: 40 }, // Strengths
    { wch: 40 }, // Weakness
  ];
  wsMaster["!cols"] = wscols;

  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Classroom Ledger");

  // Sheet 2: Conversion Guide Reference
  const scaleData = [
    ["EduGrade Computer Science Grading Scaling Standards"],
    [],
    ["Rating Band Scale", "Component Minimum Percentage", "Qualitative Equivalent", "Classroom Tally Target"],
    ["4", "90% and Above", "Excellent (Eager participation / flawless concept execution)", "Almost always active, attentive, contributing"],
    ["3", "70% – 89%", "Very Good (Consistent / Meets goals with minor assistance)", "Usually participates, sometimes distracted"],
    ["2", "50% – 69%", "Satisfactory (Satisfies core competencies / is progressing)", "Sometimes participates, needs pushing"],
    ["1", "Below 50%", "Needs Improvement (Needs extra guidelines & continuous tracking)", "Rarely participates, mostly disengaged"],
    [],
    ["Component Scoring Weights (Out of 100 Overall)"],
    ["1. Classroom Participation & Attentiveness", "10 Marks Total"],
    ["2. Homework & Independent Assignments", "10 Marks Total"],
    ["3. Theoretical Assessment (MCQ & Concepts)", "30 Marks Total"],
    ["4. Creative Programming & Practical Projects", "30 Marks Total"],
    ["5. Practical Lab Deliverables", "20 Marks Total"]
  ];

  const wsScale = XLSX.utils.aoa_to_sheet(scaleData);
  XLSX.utils.book_append_sheet(wb, wsScale, "Grading Conversion Standards");

  // Output filename
  const academicYear = new Date().getFullYear();
  XLSX.writeFile(wb, `CS_Student_Evaluation_Ledger_${academicYear}.xlsx`);
}
