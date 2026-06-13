import { StudentRecord, ScoreComponents, AfterSupportStatus } from "./types";
import { 
  generateDefaultRemarks, 
  generateDefaultStrengthsAndImprovements,
  scoreToBriefDescriptor
} from "./lib/gradeUtils";

const class3ANameRolls = [
  { roll: "1", name: "Aabish K.C" },
  { roll: "2", name: "Aron Gurung" },
  { roll: "3", name: "Aarubi Gurung" },
  { roll: "4", name: "Anon Rana" },
  { roll: "5", name: "Anubhav Subedi" },
  { roll: "6", name: "Anusuruya B.K" },
  { roll: "7", name: "Dipshikha Pariyar" },
  { roll: "8", name: "Jenisha Thapa" },
  { roll: "9", name: "Kenzina Thapa" },
  { roll: "10", name: "Nijon Pun" },
  { roll: "11", name: "Pallavi Khanal" },
  { roll: "12", name: "Prinsa Pun A" },
  { roll: "13", name: "Rainer Tilija Pun" },
  { roll: "14", name: "Rihan Bhujel" },
  { roll: "15", name: "Rushank Basyal" },
  { roll: "16", name: "Sahil Nepali" },
  { roll: "17", name: "Saimon Pun" },
  { roll: "18", name: "Samrit Tamang" },
  { roll: "19", name: "Seejan Sunar" },
  { roll: "20", name: "Shaira Pun" },
  { roll: "21", name: "Sohan Ghale" },
  { roll: "22", name: "Subina Gurung" },
  { roll: "23", name: "Syaron Gahatraj" },
  { roll: "24", name: "Tanauja Shreesh" },
  { roll: "25", name: "Yobin Rana" },
  { roll: "26", name: "Yogesh Thapa" }
];

const class3BNameRolls = [
  { roll: "1", name: "Ami Malla" },
  { roll: "2", name: "Anjila Chhantyal" },
  { roll: "3", name: "Ankit Kumar" },
  { roll: "4", name: "Arika Shrestha" },
  { roll: "5", name: "Arpan Poudel" },
  { roll: "6", name: "Ashariya Bishwokarma" },
  { roll: "7", name: "Diya Chhantyal" },
  { roll: "8", name: "Grace Rana" },
  { roll: "9", name: "Krishal Baniya" },
  { roll: "10", name: "Monali Bhowmick" },
  { roll: "11", name: "Nancy B.K" },
  { roll: "12", name: "Nipshan Pun" },
  { roll: "13", name: "Prabhash Pun" },
  { roll: "14", name: "Prasansha Sharma" },
  { roll: "15", name: "Prinsa Pun B" },
  { roll: "16", name: "Rashika Chhetri" },
  { roll: "17", name: "Riyans B.K" },
  { roll: "18", name: "Roman Pun" },
  { roll: "19", name: "Royal Pun" },
  { roll: "20", name: "Sahisa Sherpunja" },
  { roll: "21", name: "Samriddri Shrestha" },
  { roll: "22", name: "Sanvi Rana" },
  { roll: "23", name: "Saraswoti Rokka" },
  { roll: "24", name: "Sparsh Century" },
  { roll: "25", name: "Sushant Roka" },
  { roll: "26", name: "Swapnil Thajali" },
  { roll: "28", name: "Unique Nepali" }
];

function buildStudentList(): StudentRecord[] {
  const list: StudentRecord[] = [];
  const currentDate = new Date().toISOString().split("T")[0];
  const phases = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  // Helper to generate dynamic, realistic scores to make the report card look rich and ready
  const getScores = (index: number, phase: string): ScoreComponents => {
    // Introduce a little variation based on phase so that different phases have different values
    const phaseOffset = phase === "Phase 1" ? 0 : phase === "Phase 2" ? 1 : phase === "Phase 3" ? 2 : 3;
    return {
      participation: Math.min(10, Math.max(5, 7 + ((index + phaseOffset) % 4))), // 7 to 10
      homework: Math.min(10, Math.max(5, 7 + ((index + phaseOffset + 1) % 4))),  // 7 to 10
      mcq: Math.min(30, Math.max(12, 18 + (((index + phaseOffset) * 3) % 13))),    // 18 to 30
      project: Math.min(30, Math.max(12, 18 + (((index + phaseOffset) * 2) % 13))), // 18 to 30
      lab: Math.min(20, Math.max(10, 13 + ((index + phaseOffset + 2) % 8)))      // 13 to 20
    };
  };

  const mapToRecord = (
    item: { roll: string; name: string },
    grade: string,
    index: number,
    phase: string
  ): StudentRecord => {
    const scores = getScores(index, phase);
    const afterSupport: AfterSupportStatus = {
      participation: scoreToBriefDescriptor(scores.participation, 10),
      homework: scoreToBriefDescriptor(scores.homework, 10),
      mcq: scoreToBriefDescriptor(scores.mcq, 30),
      project: scoreToBriefDescriptor(scores.project, 30),
      lab: scoreToBriefDescriptor(scores.lab, 20)
    };
    const remarks = generateDefaultRemarks(scores);
    const { strengths, areasOfImprovement } = generateDefaultStrengthsAndImprovements(scores);

    const gradeCode = grade === "Class 3A" ? "3A" : "3B";
    const paddedRoll = item.roll.padStart(2, "0");
    const phaseCode = phase.replace(/\s+/g, "");

    return {
      id: `CS-3${gradeCode}-${paddedRoll}-${phaseCode}`,
      name: item.name,
      grade,
      phase,
      rollNo: item.roll,
      batch: "2083 BS",
      date: currentDate,
      evaluator: "Mr. Sudeep Shrestha",
      scores,
      afterSupport,
      remarks,
      strengths,
      areasOfImprovement
    };
  };

  phases.forEach((phase) => {
    class3ANameRolls.forEach((item, idx) => {
      list.push(mapToRecord(item, "Class 3A", idx, phase));
    });

    class3BNameRolls.forEach((item, idx) => {
      list.push(mapToRecord(item, "Class 3B", idx, phase));
    });
  });

  return list;
}

export const CLASS_3_STUDENTS = buildStudentList();
