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
 * Resolves standard professional teacher remarks based on the selected grade (1-4) for each grading area.
 * Keeps tone formal, constructive, and suitable for an official school report card.
 */
export function getRemarkByComponentAndRating(key: ComponentKey, rating: number): string {
  const rIdx = Math.max(1, Math.min(4, Math.round(rating))) as 1 | 2 | 3 | 4;

  if (key === "participation") {
    switch (rIdx) {
      case 4:
        return "Actively participates, remains attentive, follows instructions, and contributes positively to class discussions.";
      case 3:
        return "Participates regularly, usually remains attentive, and follows instructions with occasional reminders.";
      case 2:
        return "Participates occasionally but requires reminders to stay attentive and engaged during lessons.";
      case 1:
        return "Frequently lacks attention, rarely participates, and requires continuous encouragement to follow classroom expectations.";
    }
  }

  if (key === "homework") {
    switch (rIdx) {
      case 4:
        return "Consistently completes homework on time with excellent effort and works independently.";
      case 3:
        return "Usually completes homework on time and demonstrates good responsibility.";
      case 2:
        return "Completes homework inconsistently and requires encouragement to complete tasks independently.";
      case 1:
        return "Rarely completes homework and shows limited responsibility toward assigned work.";
    }
  }

  if (key === "mcq") {
    switch (rIdx) {
      case 4:
        return "Demonstrates an excellent understanding of computer concepts and consistently performs well in assessments.";
      case 3:
        return "Demonstrates a good understanding of computer concepts and performs well in most assessments.";
      case 2:
        return "Demonstrates a basic understanding of computer concepts but requires additional practice and guidance.";
      case 1:
        return "Has difficulty understanding computer concepts and requires significant support to improve performance in assessments.";
    }
  }

  if (key === "project") {
    switch (rIdx) {
      case 4:
        return "Completes assigned projects accurately, independently, and with excellent quality.";
      case 3:
        return "Completes assigned projects successfully with good quality and applies learned skills with minimal guidance.";
      case 2:
        return "Completes assigned projects with support and is gradually developing confidence in applying learned skills.";
      case 1:
        return "Experiences difficulty completing assigned projects and requires continuous guidance and encouragement.";
    }
  }

  if (key === "lab") {
    switch (rIdx) {
      case 4:
        return "Follows lab instructions carefully, uses computer resources responsibly, and completes practical activities independently and accurately.";
      case 3:
        return "Usually follows lab instructions, uses computer resources appropriately, and completes practical activities with minimal assistance.";
      case 2:
        return "Follows lab instructions inconsistently and requires guidance to complete practical activities successfully.";
      case 1:
        return "Frequently fails to follow lab instructions, struggles to complete practical activities, and requires continuous supervision and support.";
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

  const rating4 = evaluated.filter(item => item.rating === 4).map(item => item.key);
  const rating3 = evaluated.filter(item => item.rating === 3).map(item => item.key);
  const rating2 = evaluated.filter(item => item.rating === 2).map(item => item.key);
  const rating1 = evaluated.filter(item => item.rating === 1).map(item => item.key);

  const maxRating = Math.max(...evaluated.map(item => item.rating)) as 1 | 2 | 3 | 4;

  let strengths = "";
  let areasOfImprovement = "";

  // Helper dictionary of standard qualities to keep phrases varied and naturally readable
  const strengthDict: Record<ComponentKey, { phrase4: string; phrase3: string; noun: string }> = {
    participation: {
      phrase4: "remains exceptionally attentive and actively participates in classroom discussions",
      phrase3: "shares ideas regularly and remains attentive during lessons",
      noun: "classroom attentiveness"
    },
    homework: {
      phrase4: "consistently completes independent homework with outstanding effort",
      phrase3: "usually completes homework tasks on time and works responsibly",
      noun: "responsibility in homework tasks"
    },
    mcq: {
      phrase4: "demonstrates an excellent understanding of theoretical computer concepts",
      phrase3: "shows a solid understanding of fundamental computer concepts",
      noun: "knowledge of computer concepts"
    },
    project: {
      phrase4: "produces high-quality, creative computer projects independently",
      phrase3: "completes assigned computer projects successfully with good quality",
      noun: "creative projects"
    },
    lab: {
      phrase4: "follows practical lab instructions perfectly and uses resources responsibly",
      phrase3: "usually follows practical lab instructions and uses computer tools well",
      noun: "practical lab performance"
    }
  };

  const improvementDict: Record<ComponentKey, { phrase2: string; phrase1: string; noun: string }> = {
    participation: {
      phrase2: "improve attentiveness and stay more focused during lessons",
      phrase1: "strive to participate more actively and follow classroom expectations",
      noun: "classroom participation"
    },
    homework: {
      phrase2: "complete homework assignments more consistently with independent effort",
      phrase1: "regularly complete assigned work and build basic responsibility",
      noun: "homework completion"
    },
    mcq: {
      phrase2: "spend extra time reviewing lesson notes to build stronger concept understanding",
      phrase1: "focus on learning basic computer concepts with steady guidance",
      noun: "computer concept comprehension"
    },
    project: {
      phrase2: "develop confidence when applying practical skills in computer projects",
      phrase1: "work on completing assigned projects with consistent help",
      noun: "project work"
    },
    lab: {
      phrase2: "follow lab instructions more consistently to complete activities successfully",
      phrase1: "listen carefully to instructions and follow lab expectations during practical tasks",
      noun: "practical lab skills"
    }
  };

  // --- STRENGTHS GENERATION ---
  if (rating4.length === 5) {
    strengths = "Consistently demonstrates excellent participation, responsibility, understanding of computer concepts, and practical skills across all learning activities.";
  } else if (rating3.length === 5) {
    strengths = "Demonstrates good classroom participation, completes assigned work responsibly, and shows a sound understanding of computer concepts.";
  } else if (rating1.length + rating2.length === 5) {
    // If all are low (1s and 2s)
    if (rating2.length > 0) {
      strengths = "Shows a basic understanding of computer concepts and demonstrates the potential to improve with continued effort.";
    } else {
      strengths = "Approaches learning activities with a cooperative attitude and shows receptiveness to support and encouragement.";
    }
  } else {
    // Standard mix
    if (rating4.length > 0) {
      if (rating4.length === 1) {
        const k = rating4[0];
        const rest3Nouns = rating3.map(tk => strengthDict[tk].noun);
        if (rest3Nouns.length > 0) {
          strengths = `Exhibits excellent performance as they ${strengthDict[k].phrase4}, while showing nice capability in ${joinWithAnd(rest3Nouns)}.`;
        } else {
          strengths = `Consistently ${strengthDict[k].phrase4} and approaches all learning tasks with great interest.`;
        }
      } else if (rating4.length === 2) {
        const k1 = rating4[0];
        const k2 = rating4[1];
        const rest3Nouns = rating3.map(tk => strengthDict[tk].noun);
        if (rest3Nouns.length > 0) {
          strengths = `Demonstrates excellent skills as they ${strengthDict[k1].phrase4} and ${strengthDict[k2].phrase4}, alongside good ${joinWithAnd(rest3Nouns)}.`;
        } else {
          strengths = `Distinguishes themselves as they ${strengthDict[k1].phrase4} and ${strengthDict[k2].phrase4}.`;
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
      strengths = `Demonstrates good progress in ${joinWithAnd(nouns3)} and approaches computer studies with a positive learning attitude.`;
    } else {
      strengths = "Shows general willingness to learn and friendly cooperation during group tasks.";
    }
  }

  // --- AREAS FOR IMPROVEMENT GENERATION ---
  if (rating3.length + rating4.length === 5) {
    if (rating4.length === 5) {
      areasOfImprovement = "Continue maintaining this excellent performance while exploring opportunities to further develop creativity and independent learning.";
    } else {
      const keyPr = rating3[0] || rating4[0];
      if (keyPr === "participation") {
        areasOfImprovement = "Are encouraged to share ideas more frequently during lessons to further build confidence in public class discussions.";
      } else if (keyPr === "homework") {
        areasOfImprovement = "Is encouraged to maintain high level of independent research when completing homework tasks.";
      } else if (keyPr === "mcq") {
        areasOfImprovement = "Can continue exploring advanced computer hardware and software theory to further deepen their clear knowledge.";
      } else if (keyPr === "project") {
        areasOfImprovement = "Is encouraged to apply highly creative designs and advanced structures in future practical assignments.";
      } else {
        areasOfImprovement = "Can focus on completing practical lab challenges entirely independently to further enhance computer confidence.";
      }
    }
  } else if (rating1.length + rating2.length === 5) {
    areasOfImprovement = "Should participate more actively, complete assigned work consistently, and follow lab instructions carefully to strengthen overall performance.";
  } else {
    if (rating1.length > 0) {
      const p1 = rating1.map(tk => improvementDict[tk].phrase1);
      if (rating1.length === 1) {
        areasOfImprovement = `To build stronger progress, they should ${p1[0]} and seek support when facing task difficulties.`;
      } else {
        const combinedP1 = rating1.map(tk => improvementDict[tk].noun);
        areasOfImprovement = `Requires focused effort and continuous support to improve in ${joinWithAnd(combinedP1)} fields.`;
      }
    } else {
      const p2 = rating2.map(tk => improvementDict[tk].phrase2);
      if (rating2.length === 1) {
        const k = rating2[0];
        if (k === "lab") {
          areasOfImprovement = "Should improve attentiveness and follow lab instructions more consistently to perform practical activities with greater confidence.";
        } else {
          areasOfImprovement = `To secure better learning outcomes, they should work to ${p2[0]}.`;
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
