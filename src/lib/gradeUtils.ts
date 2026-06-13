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
    let desc = "";

    if (key === "participation") {
      if (rating === 4) {
        desc = "Actively participates in class discussions, remains highly attentive, and consistently contributes positive ideas and responses.";
      } else if (rating === 3) {
        desc = "Participates regularly in class activities, stays attentive, and responds appropriately when encouraged.";
      } else if (rating === 2) {
        desc = "Shows occasional participation and attentiveness but requires reminders to remain focused and engaged.";
      } else {
        desc = "Rarely participates in class activities and requires frequent support to maintain attention and involvement.";
      }
    } else if (key === "homework") {
      if (rating === 4) {
        desc = "Consistently completes homework on time with excellent effort, accuracy, and independence.";
      } else if (rating === 3) {
        desc = "Regularly completes homework and demonstrates a good level of effort and responsibility.";
      } else if (rating === 2) {
        desc = "Completes homework inconsistently and may require additional guidance or encouragement.";
      } else {
        desc = "Rarely completes homework and needs significant support to develop responsible work habits.";
      }
    } else if (key === "mcq") {
      if (rating === 4) {
        desc = "Demonstrates an excellent understanding of computer concepts and performs very well in tests, quizzes, and MCQs.";
      } else if (rating === 3) {
        desc = "Shows a good understanding of computer concepts and achieves satisfactory assessment results.";
      } else if (rating === 2) {
        desc = "Demonstrates a basic understanding of concepts but requires further practice and reinforcement.";
      } else {
        desc = "Has difficulty understanding key concepts and requires considerable support to improve learning outcomes.";
      }
    } else if (key === "project") {
      if (rating === 4) {
        desc = "Produces creative and well-organized work, successfully applying learned skills in projects and activities.";
      } else if (rating === 3) {
        desc = "Completes projects effectively and demonstrates a good application of learned skills.";
      } else if (rating === 2) {
        desc = "Completes projects with support and is developing confidence in applying learned skills.";
      } else {
        desc = "Requires significant assistance to complete projects and apply learned concepts.";
      }
    } else if (key === "lab") {
      if (rating === 4) {
        desc = "Performs practical tasks confidently, follows instructions carefully, and demonstrates strong computer skills.";
      } else if (rating === 3) {
        desc = "Completes practical activities successfully and demonstrates good use of computer skills.";
      } else if (rating === 2) {
        desc = "Participates in practical activities but requires guidance to complete tasks accurately.";
      } else {
        desc = "Experiences difficulty during practical activities and requires frequent support and supervision.";
      }
    }

    remarks[key] = desc;
  });

  return remarks;
}

/**
 * Dynamically generates personalized, understandable strengths and areas of improvement based on raw scores.
 */
export function generateDefaultStrengthsAndImprovements(components: StudentRecord["scores"]): {
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

  const rating4 = evaluated.filter(item => item.rating === 4);
  const rating3 = evaluated.filter(item => item.rating === 3);
  const rating2 = evaluated.filter(item => item.rating === 2);
  const rating1 = evaluated.filter(item => item.rating === 1);

  const premiumStrengths = [...rating4, ...rating3];
  const improvementAreas = [...rating1, ...rating2];

  // 1. DYNAMICALLY GENERATE GENERAL STRENGTHS
  let strengths = "";

  const strengthPhrases: Record<ComponentKey, string> = {
    participation: "paying great attention and participating actively in all classroom discussions",
    homework: "completing and handing in homework assignments with excellent independence",
    mcq: "explaining and demonstrating a very good understanding of theoretical computer concepts",
    project: "putting together creative ideas to create beautifully organized computer projects",
    lab: "performing practical laboratory activities and handling digital tools with confidence"
  };

  if (premiumStrengths.length > 0) {
    if (premiumStrengths.length === 5) {
      strengths = "Does exceptionally well in all parts of computer class. They stay very focused during lessons, submit homework on time, and show great ideas in practical lab activities.";
    } else {
      const phrases = premiumStrengths.map(item => strengthPhrases[item.key]);
      let joinedPhrases = "";
      if (phrases.length === 1) {
        joinedPhrases = phrases[0];
      } else if (phrases.length === 2) {
        joinedPhrases = `${phrases[0]} and ${phrases[1]}`;
      } else {
        joinedPhrases = `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
      }
      strengths = `Demonstrates great strength in ${joinedPhrases}. They always try their best and complete their assignments with beautiful care.`;
    }
  } else if (rating2.length > 0) {
    const phrases = rating2.map(item => strengthPhrases[item.key]);
    let joinedPhrases = "";
    if (phrases.length === 1) {
      joinedPhrases = phrases[0];
    } else if (phrases.length === 2) {
      joinedPhrases = `${phrases[0]} and ${phrases[1]}`;
    } else {
      joinedPhrases = `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
    }
    strengths = `Maintains stable progress and a sound general standard in ${joinedPhrases}. They show a happy attitude towards learning new things in class.`;
  } else {
    strengths = "Comes to the computer room with a very happy smile. They follow the class rules well and are friendly and cooperative with everyone.";
  }

  // 2. DYNAMICALLY GENERATE GENERAL AREAS OF IMPROVEMENT
  let areasOfImprovement = "";

  const growthPhrases: Record<ComponentKey, string> = {
    participation: "paying attention when tasks are explained and asking or answering questions in class",
    homework: "submitting homework tasks regularly and working on them more independently",
    mcq: "reviewing computer parts and lesson notes at home to prepare better for quizzes",
    project: "spending a bit more time planning projects to complete computer activities with care",
    lab: "practicing keyboard typing drills and mouse controls to complete lab sessions faster"
  };

  if (rating1.length > 0) {
    const phrases = rating1.map(item => growthPhrases[item.key]);
    let joinedPhrases = "";
    if (phrases.length === 1) {
      joinedPhrases = phrases[0];
    } else if (phrases.length === 2) {
      joinedPhrases = `${phrases[0]} and ${phrases[1]}`;
    } else {
      joinedPhrases = `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
    }
    areasOfImprovement = `Would benefit from extra home practice or guidance with ${joinedPhrases}. With small, steady steps and encouragement, they will surely build up their skills.`;
  } else if (rating2.length > 0) {
    const phrases = rating2.map(item => growthPhrases[item.key]);
    let joinedPhrases = "";
    if (phrases.length === 1) {
      joinedPhrases = phrases[0];
    } else if (phrases.length === 2) {
      joinedPhrases = `${phrases[0]} and ${phrases[1]}`;
    } else {
      joinedPhrases = `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
    }
    areasOfImprovement = `To get even better results, they are encouraged to focus on ${joinedPhrases}. Doing regular key practice will lead to great confidence and excellent scores!`;
  } else {
    areasOfImprovement = "No major concerns. They can keep exploring advanced computer activities or take up friendly roles helping peers who are still learning.";
  }

  return { strengths, areasOfImprovement };
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
