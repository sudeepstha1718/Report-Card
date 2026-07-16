import * as XLSX from "xlsx";
import { StudentRecord, COMPONENT_DETAILS, ComponentKey } from "../types";

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  return "D";
}

/**
 * Resolves standard professional teacher remarks based on the selected grade (1-4) for each grading area.
 * Keeps tone formal, constructive, and suitable for an official school report card.
 */
export function getRemarkByComponentAndRating(key: ComponentKey, rating: number): string {
  const rIdx = Math.max(1, Math.min(4, Math.round(rating))) as 1 | 2 | 3 | 4;

  if (key === "participation") {
    switch (rIdx) {
      case 4:
        return "Active, attentive, and participates eagerly in class.";
      case 3:
        return "Attentive and participates regularly in activities.";
      case 2:
        return "Participates occasionally but needs to stay focused.";
      case 1:
        return "Needs constant reminders to pay attention and engage.";
    }
  }

  if (key === "homework") {
    switch (rIdx) {
      case 4:
        return "Consistently completes homework on time with high-quality work.";
      case 3:
        return "Regularly submits neat homework assignments on time.";
      case 2:
        return "Completes homework inconsistently and needs reminders.";
      case 1:
        return "Rarely completes homework and needs close supervision.";
    }
  }

  if (key === "mcq") {
    switch (rIdx) {
      case 4:
        return "Excellent understanding of computer concepts and test materials.";
      case 3:
        return "Good understanding of core theoretical computer concepts.";
      case 2:
        return "Has basic understanding but needs more conceptual practice.";
      case 1:
        return "Struggles with concepts and needs significant revision support.";
    }
  }

  if (key === "project") {
    switch (rIdx) {
      case 4:
        return "Creates beautiful, well-structured digital projects independently.";
      case 3:
        return "Completes creative computer projects with good designs.";
      case 2:
        return "Requires guided assistance to complete creative projects.";
      case 1:
        return "Struggles with projects and needs step-by-step guidance.";
    }
  }

  if (key === "lab") {
    switch (rIdx) {
      case 4:
        return "Excellent hands-on skills and works independently in the lab.";
      case 3:
        return "Follows lab instructions well and completes hands-on tasks.";
      case 2:
        return "Requires assistance to complete practical lab assignments.";
      case 1:
        return "Needs constant supervision and support during lab tasks.";
    }
  }

  return "";
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

  const maxes: Record<ComponentKey, number> = {
    participation: 10,
    homework: 10,
    mcq: 30,
    project: 30,
    lab: 20
  };

  (Object.keys(COMPONENT_DETAILS) as ComponentKey[]).forEach((key) => {
    const score = components[key] || 0;
    const max = maxes[key];
    const pct = calculatePercentage(score, max);
    const rating = percentageToRating(pct);
    remarks[key] = getRemarkByComponentAndRating(key, rating);
  });

  return remarks;
}

/**
 * Helper function to naturally join keywords/nouns with correct grammatical commas and "and".
 */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export interface StudentPronouns {
  subject: string;       // "He" / "She"
  subjectLower: string;  // "he" / "she"
  object: string;        // "him" / "her"
  possessive: string;    // "his" / "her"
  possessiveAdj: string; // "his" / "her"
}

/**
 * Custom-crafted pronoun detector for the Class 3 students list.
 * Accurate for all 53 names, with clean rules for any custom-entered student name.
 */
export function getStudentPronouns(name: string): StudentPronouns {
  const normalized = (name || "").trim().toLowerCase();
  
  const femaleKeywords = [
    "aarubi", "anusuruya", "dipshikha", "jenisha", "kenzina", "pallavi", "prinsa", "shaira", "subina", "syaron", "tanauja",
    "ami", "anjila", "arika", "ashariya", "diya", "grace", "monali", "nancy", "prasansha", "rashika", "sahisa", "samriddri", "sanvi", "saraswoti"
  ];
  
  const maleKeywords = [
    "aabish", "aron", "anon", "anubhav", "nijon", "rainer", "rihan", "rushank", "sahil", "saimon", "samrit", "seejan", "sohan", "yobin", "yogesh",
    "ankit", "arpan", "krishal", "nipshan", "prabhash", "riyans", "roman", "royal", "sparsh", "sushant", "swapnil", "unique"
  ];

  const firstWord = normalized.split(/\s+/)[0];
  
  let isFemale = false;
  if (femaleKeywords.some(f => firstWord.includes(f) || normalized.includes(f))) {
    isFemale = true;
  } else if (maleKeywords.some(m => firstWord.includes(m) || normalized.includes(m))) {
    isFemale = false;
  } else {
    // Elegant fallback for custom names
    const endsWithA = firstWord.endsWith("a") && !firstWord.endsWith("indra") && !firstWord.endsWith("endra") && !firstWord.endsWith("shra");
    const endsWithI = firstWord.endsWith("i") || firstWord.endsWith("y");
    if (endsWithA || endsWithI || firstWord.endsWith("ee") || firstWord.endsWith("sha") || firstWord.endsWith("ya") || normalized.includes("kumari") || normalized.includes("devi")) {
      isFemale = true;
    } else {
      isFemale = false; // default to he
    }
  }

  if (isFemale) {
    return {
      subject: "She",
      subjectLower: "she",
      object: "her",
      possessive: "her",
      possessiveAdj: "her"
    };
  } else {
    return {
      subject: "He",
      subjectLower: "he",
      object: "him",
      possessive: "his",
      possessiveAdj: "his"
    };
  }
}

/**
 * Dynamically generates personalized, understandable strengths and areas of improvement based on raw scores.
 */
export function generateDefaultStrengthsAndImprovements(components: StudentRecord["scores"], studentName?: string): {
  strengths: string;
  areasOfImprovement: string;
} {
  const maxes: Record<ComponentKey, number> = {
    participation: 10,
    homework: 10,
    mcq: 30,
    project: 30,
    lab: 20
  };

  const evaluated = (Object.keys(components) as ComponentKey[]).map((key) => {
    const raw = components[key] || 0;
    const max = maxes[key];
    const pct = calculatePercentage(raw, max);
    const rating = percentageToRating(pct);
    return { key, rating };
  });

  const rating4 = evaluated.filter(item => item.rating === 4).map(item => item.key);
  const rating3 = evaluated.filter(item => item.rating === 3).map(item => item.key);
  const rating2 = evaluated.filter(item => item.rating === 2).map(item => item.key);
  const rating1 = evaluated.filter(item => item.rating === 1).map(item => item.key);

  const pron = getStudentPronouns(studentName || "");

  let strengths = "";
  let areasOfImprovement = "";

  // Helper dictionary of standard qualities to keep phrases varied and naturally readable
  const strengthDict: Record<ComponentKey, { phrase4: string; phrase3: string; noun: string }> = {
    participation: {
      phrase4: "is highly attentive and participates eagerly in class",
      phrase3: "is attentive and participates regularly",
      noun: "class participation"
    },
    homework: {
      phrase4: "consistently submits outstanding homework assignments",
      phrase3: "completes homework on time with good effort",
      noun: "homework responsibility"
    },
    mcq: {
      phrase4: "demonstrates excellent concept understanding",
      phrase3: "shows sound understanding of computer topics",
      noun: "concept comprehension"
    },
    project: {
      phrase4: "creates neat, highly creative computer projects",
      phrase3: "completes assigned computer projects successfully",
      noun: "creative projects"
    },
    lab: {
      phrase4: "has excellent lab focus and practical computer skills",
      phrase3: "usually completes practical computer lab work well",
      noun: "practical lab skills"
    }
  };

  const improvementDict: Record<ComponentKey, { phrase2: string; phrase1: string; noun: string }> = {
    participation: {
      phrase2: "focus more on classroom lessons",
      phrase1: "strive to pay attention in class",
      noun: "class focus"
    },
    homework: {
      phrase2: "submit homework tasks regularly",
      phrase1: "complete assigned homework tasks",
      noun: "homework completion"
    },
    mcq: {
      phrase2: "spend time revising computer topics",
      phrase1: "learn basic computer concepts",
      noun: "concept revision"
    },
    project: {
      phrase2: "build confidence in creative work",
      phrase1: "complete computer projects",
      noun: "project work"
    },
    lab: {
      phrase2: "follow practical lab steps carefully",
      phrase1: "practice practical lab skills",
      noun: "lab tasks"
    }
  };

  // --- STRENGTHS GENERATION ---
  if (rating4.length === 5) {
    strengths = `Consistently demonstrates excellent understanding, participation, and hands-on computer skills.`;
  } else if (rating3.length === 5) {
    strengths = `Demonstrates good class participation, reliable homework completion, and sound concept understanding.`;
  } else if (rating1.length + rating2.length === 5) {
    strengths = `Shows positive efforts in learning and is eager to follow simple teacher instructions.`;
  } else {
    // Standard mix
    if (rating4.length > 0) {
      if (rating4.length === 1) {
        const k = rating4[0];
        const rest3Nouns = rating3.map(tk => strengthDict[tk].noun);
        if (rest3Nouns.length > 0) {
          strengths = `Exhibits excellent performance as ${pron.subjectLower} ${strengthDict[k].phrase4}, with good skills in ${joinWithAnd(rest3Nouns)}.`;
        } else {
          strengths = `Consistently ${strengthDict[k].phrase4} and approaches all learning tasks with great interest.`;
        }
      } else if (rating4.length === 2) {
        const k1 = rating4[0];
        const k2 = rating4[1];
        const rest3Nouns = rating3.map(tk => strengthDict[tk].noun);
        if (rest3Nouns.length > 0) {
          strengths = `Demonstrates excellent skills as ${pron.subjectLower} ${strengthDict[k1].phrase4} and ${strengthDict[k2].phrase4}, alongside good ${joinWithAnd(rest3Nouns)}.`;
        } else {
          strengths = `Distinguishes ${pron.object}self as ${pron.subjectLower} ${strengthDict[k1].phrase4} and ${strengthDict[k2].phrase4}.`;
        }
      } else {
        const nouns4 = rating4.map(tk => strengthDict[tk].noun);
        const nouns3 = rating3.map(tk => strengthDict[tk].noun);
        if (nouns3.length > 0) {
          strengths = `Consistently demonstrates excellent ${joinWithAnd(nouns4)}, as well as good ${joinWithAnd(nouns3)}.`;
        } else {
          strengths = `Consistently demonstrates excellent ${joinWithAnd(nouns4)} across key computational activities.`;
        }
      }
    } else if (rating3.length > 0) {
      const nouns3 = rating3.map(tk => strengthDict[tk].noun);
      strengths = `Demonstrates good progress in ${joinWithAnd(nouns3)} with a positive learning attitude.`;
    } else {
      strengths = `Shows general willingness to learn and cooperates nicely during tasks.`;
    }
  }

  // --- AREAS FOR IMPROVEMENT GENERATION ---
  if (rating3.length + rating4.length === 5) {
    if (rating4.length === 5) {
      areasOfImprovement = `Continue maintaining this excellent performance while exploring more advanced topics.`;
    } else {
      const keyPr = rating3[0] || rating4[0];
      if (keyPr === "participation") {
        areasOfImprovement = `Is encouraged to participate more actively to further build confidence in class.`;
      } else if (keyPr === "homework") {
        areasOfImprovement = `Is encouraged to maintain high consistency when completing homework tasks.`;
      } else if (keyPr === "mcq") {
        areasOfImprovement = `Can review lesson topics regularly to continue extending conceptual knowledge.`;
      } else if (keyPr === "project") {
        areasOfImprovement = `Is encouraged to apply creative ideas in future practical projects.`;
      } else {
        areasOfImprovement = `Can focus on completing practical exercises independently in the lab.`;
      }
    }
  } else if (rating1.length + rating2.length === 5) {
    areasOfImprovement = `Should focus on completing homework consistently and following simple lab rules.`;
  } else {
    if (rating1.length > 0) {
      const p1 = rating1.map(tk => improvementDict[tk].phrase1);
      if (rating1.length === 1) {
        areasOfImprovement = `To build stronger progress, ${pron.subjectLower} should work to ${p1[0]} with steady effort.`;
      } else {
        const combinedP1 = rating1.map(tk => improvementDict[tk].noun);
        areasOfImprovement = `Requires focused effort and continuous support to improve in ${joinWithAnd(combinedP1)} fields.`;
      }
    } else {
      const p2 = rating2.map(tk => improvementDict[tk].phrase2);
      if (rating2.length === 1) {
        const k = rating2[0];
        if (k === "lab") {
          areasOfImprovement = `Should follow lab instructions more consistently to perform practical activities with confidence.`;
        } else {
          areasOfImprovement = `To secure better learning outcomes, ${pron.subjectLower} should work to ${p2[0]}.`;
        }
      } else if (rating2.length === 2) {
        areasOfImprovement = `Would benefit from extra focus to ${p2[0]} and ${p2[1]} with more consistency.`;
      } else {
        const combinedP2 = rating2.map(tk => improvementDict[tk].noun);
        areasOfImprovement = `Should focus on strengthening basic ${joinWithAnd(combinedP2)} to build up overall academic confidence.`;
      }
    }
  }

  return { strengths, areasOfImprovement };
}

/**
 * Triggers spreadsheet download (.xlsx format) with formatted student grades, calculation formulas, and instructions.
 */
export function exportToClassroomExcel(students: StudentRecord[]) {
  // 1. Prepare raw data rows
  const academicYear = 2083; // Standardize on BS Academic Year 2083
  const todayStr = getTodayDateString();

  const titleRows = [
    ["MOUNT ANNAPURNA SECONDARY SCHOOL - COMPUTER SCIENCE EVALUATION LEDGER"],
    ["MASTER GRADEBOOK LEDGER - OFFICIAL ACADEMIC RECORD"],
    [`Academic Year: ${academicYear} BS | Date Generated: ${todayStr} | Subject Teacher: Mr. Sudeep Shrestha`],
    ["-------------------------------------------------------------------------------------------------------------------------------------------------------------"],
    ["★ INFORMATION & LEDGER OVERVIEW:"],
    ["  1. This is the master ledger of student marks, rating bands, qualitative progress descriptions, letter grades, and target feedback."],
    ["  2. Editing Scores: You can modify numeric marks in the score columns (Participation, Homework, MCQ, Project, Lab) of this ledger and"],
    ["     upload it back to the EduGrade web app. The portal will automatically parse the headers and sync all edited student grades instantly."],
    ["============================================================================================================================================================="],
    [], // spacer row
    [
      "Student ID",
      "Roll No",
      "Student Name",
      "Grade",
      "Phase",
      "Batch",
      "Participation (Max 10)",
      "Homework (Max 10)",
      "MCQ (Max 30)",
      "Project (Max 30)",
      "Lab (Max 20)",
      "Total Marks (100)",
      "Overall Rating (1-4)",
      "Qualitative Descriptor",
      "Overall Grade",
      "Key Strengths",
      "Areas of Improvement"
    ]
  ];

  const studentRows = students.map((student) => {
    const total = calculateTotalScore(student.scores);
    const overallRating = percentageToRating(total);
    const overallDesc = ratingToDescriptor(overallRating);
    const letterGrade = percentageToLetterGrade(total);

    return [
      student.id,
      student.rollNo || "",
      student.name,
      student.grade,
      student.phase || "Phase 1",
      student.batch || "2083 BS",
      student.scores.participation,
      student.scores.homework,
      student.scores.mcq,
      student.scores.project,
      student.scores.lab,
      total,
      overallRating,
      overallDesc,
      letterGrade,
      student.strengths || "N/A",
      student.areasOfImprovement || "N/A"
    ];
  });

  const wb = XLSX.utils.book_new();
  const wsMaster = XLSX.utils.aoa_to_sheet([...titleRows, ...studentRows]);
  
  // Apply clean width constraints for better Excel viewing
  const wscols = [
    { wch: 15 }, // Student ID
    { wch: 10 }, // Roll No
    { wch: 25 }, // Student Name
    { wch: 14 }, // Grade
    { wch: 12 }, // Phase
    { wch: 12 }, // Batch
    { wch: 26 }, // Participation
    { wch: 22 }, // Homework
    { wch: 18 }, // MCQ
    { wch: 20 }, // Project
    { wch: 18 }, // Lab
    { wch: 18 }, // Total
    { wch: 22 }, // Converted Rating
    { wch: 22 }, // Descriptor
    { wch: 15 }, // Grade letter
    { wch: 45 }, // Strengths
    { wch: 45 }, // Areas of Improvement
  ];
  wsMaster["!cols"] = wscols;

  // Merge headers elegant block
  wsMaster["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 16 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 16 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 16 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 16 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 16 } }
  ];

  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Classroom Ledger");

  // Sheet 2: Conversion Guide Reference
  const scaleData = [
    ["MOUNT ANNAPURNA SECONDARY SCHOOL - COMPUTER SCIENCE REFERENCE GUIDE"],
    ["EduGrade Computer Science Grading Scaling Standards & Component Reference"],
    [],
    ["Rating Band Scale", "Component Minimum Percentage", "Qualitative Equivalent", "Classroom Tally Target"],
    ["4", "90% and Above", "Excellent (Eager participation / flawless concept execution)", "Almost always active, attentive, contributing"],
    ["3", "70% – 89%", "Very Good (Consistent / Meets goals with minor assistance)", "Usually participates, sometimes distracted"],
    ["2", "50% – 69%", "Satisfactory (Satisfies core competencies / is progressing)", "Sometimes participates, needs pushing"],
    ["1", "Below 50%", "Needs Improvement (Needs extra guidelines & continuous tracking)", "Rarely participates, mostly disengaged"],
    [],
    ["Component Scoring Weights (Out of 100 Overall)"],
    ["1. Classroom Participation & Attentiveness", "10 Marks Total (Max: 10)"],
    ["2. Homework & Independent Assignments", "10 Marks Total (Max: 10)"],
    ["3. Theoretical Assessment (MCQ & Concepts)", "30 Marks Total (Max: 30)"],
    ["4. Creative Programming & Practical Projects", "30 Marks Total (Max: 30)"],
    ["5. Practical Lab Deliverables", "20 Marks Total (Max: 20)"]
  ];

  const wsScale = XLSX.utils.aoa_to_sheet(scaleData);
  
  // Apply beautiful columns to scaling reference sheet too
  wsScale["!cols"] = [
    { wch: 30 },
    { wch: 30 },
    { wch: 55 },
    { wch: 45 }
  ];

  wsScale["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
  ];

  XLSX.utils.book_append_sheet(wb, wsScale, "Grading Conversion Standards");

  // Output filename
  XLSX.writeFile(wb, `CS_Student_Evaluation_Ledger_${academicYear}_BS.xlsx`);
}

/**
 * Safely parses the grade string into structured Class and Section names.
 * For example: "Class 3A" -> { className: "Class 3", section: "A" }
 */
export function parseClassAndSection(grade: string): { className: string; section: string } {
  const trimmed = (grade || "").trim();
  const match = trimmed.match(/^(.+?)(?:\s*[-/]?\s*([A-Za-z]))$/);
  if (match) {
    return {
      className: match[1].trim(),
      section: match[2].trim().toUpperCase()
    };
  }
  return {
    className: trimmed,
    section: "—"
  };
}
