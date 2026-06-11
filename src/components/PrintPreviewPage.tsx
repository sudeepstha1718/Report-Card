import React, { useEffect, useState } from "react";
import { School, CheckCircle, Download, Printer, XCircle, ArrowLeft } from "lucide-react";
import { StudentRecord, COMPONENT_DETAILS, ComponentKey } from "../types";
import { 
  calculatePercentage, 
  percentageToRating, 
  percentageToLetterGrade, 
  calculateTotalScore 
} from "../lib/gradeUtils";

// @ts-ignore
import html2pdf from "html2pdf.js";

interface PrintPreviewPageProps {
  student: StudentRecord | undefined;
  mode: "print" | "download";
  schoolName: string;
}

export const PrintPreviewPage: React.FC<PrintPreviewPageProps> = ({
  student,
  mode,
  schoolName
}) => {
  const [status, setStatus] = useState<string>("Initializing page renderer...");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!student) {
      setErrorMsg("Student record not found. Please choose an active student from the roster.");
      return;
    }

    // Give time for layout calculations, font loading, etc.
    const timer = setTimeout(async () => {
      const element = document.getElementById("printable-report-card");
      if (!element) {
        setErrorMsg("Error: Print layout element container missing.");
        return;
      }

      // Format clean filename: Name-phX-class-rollno
      const phaseRaw = student.phase || "Phase 1";
      const phaseStr = phaseRaw.toLowerCase().replace(/\s+/g, "").replace("phase", "ph");
      const rollStr = student.rollNo || "—";
      const filenameClean = `${student.name}-${phaseStr}-${student.grade}-${rollStr}`.replace(/[\/\\:*?"<>|]/g, "_");

      if (mode === "download") {
        setStatus(`Preparing and rendering direct A4 PDF for ${student.name}...`);
        
        const opt = {
          margin:       0,
          filename:     `${filenameClean}.pdf`,
          image:        { type: "jpeg" as const, quality: 0.98 },
          html2canvas:  { 
            scale: 2.2, 
            useCORS: true, 
            letterRendering: true,
            logging: false,
            backgroundColor: "#ffffff"
          },
          jsPDF:        { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
        };

        try {
          // Trigger html2pdf with ESM package directly
          await html2pdf().set(opt).from(element).save();
          setStatus(`Successfully downloaded: "${filenameClean}.pdf"!`);
          setIsCompleted(true);
        } catch (err: any) {
          console.error("Direct html2pdf error:", err);
          setErrorMsg("PDF generation blocked or failed. Please use 'Ctrl + P' / standard Print and choose 'Save as PDF' as destination.");
        }
      } else {
        setStatus(`Opening system print controls for ${student.name}...`);
        try {
          window.print();
          setStatus("Print dialog dispatched successfully!");
          setIsCompleted(true);
        } catch (err: any) {
          console.error("Print call error:", err);
          setErrorMsg("Failed to open print dialog due to browser constraints.");
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [student, mode]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 font-sans">
        <div className="bg-slate-850 p-8 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl text-center space-y-4">
          <XCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold tracking-tight">Print Operation Blocked</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {errorMsg}
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.close()}
              className="w-full bg-slate-800 hover:bg-slate-755 text-white font-bold py-2 px-4 rounded-xl transition duration-150 active:scale-[0.98] text-sm"
            >
              Close Print Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 font-sans">
        <div className="text-center space-y-2">
          <School className="h-10 w-10 text-slate-500 animate-pulse mx-auto" />
          <p className="text-sm text-slate-400">Loading student transcript record data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4 font-sans print:bg-white print:p-0 print:m-0">
      
      {/* Strict Print CSS overrides */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible !important;
          }
          #printable-report-card {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 10mm 12mm 10mm 12mm !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
          }
        }
        
        /* Direct PDF Generation Dimensions */
        .pdf-compile-canvas {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding: 10mm 12mm 10mm 12mm !important;
          margin: 0 auto !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
          background-color: #ffffff !important;
        }
      `}</style>

      {/* Action Progress Controller (Hidden on paper) */}
      <div className="w-full max-w-[210mm] mb-6 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-spin">
              <School className="h-4.5 w-4.5" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-white">{status}</p>
            <p className="text-[10px] text-slate-400">Ready to save high-fidelity A4 document.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isCompleted && (
            <button
              onClick={() => window.close()}
              className="bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs px-3.5 py-1.8 rounded-lg shadow cursor-pointer transition active:scale-[0.98] flex items-center gap-1.5"
            >
              ✕ Close Tab
            </button>
          )}
        </div>
      </div>

      {/* Standard Borcelle-Style Print Sheet Wrapper */}
      <div 
        id="printable-report-card" 
        className="w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-white text-slate-900 flex flex-col justify-between p-[12mm] border border-slate-300 shadow-2xl rounded-2xl box-sizing-border font-sans relative overflow-hidden"
      >
        {/* Header Block */}
        <div className="space-y-3">
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <School className="h-5.5 w-5.5 text-slate-900 stroke-[2.3]" />
                <span className="font-extrabold text-base tracking-tight text-slate-900 font-mono uppercase">
                  {schoolName}
                </span>
              </div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Official Student Performance Transcript</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                Evaluation Report
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono">
                Subject: Computer Science
              </p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 grid grid-cols-3 gap-y-2 gap-x-4 text-[11px] shadow-sm">
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Student Name</p>
              <p className="font-extrabold text-slate-900 text-xs">{student.name}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Roll Number</p>
              <p className="font-extrabold text-blue-700 font-mono text-xs">{student.rollNo || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Grade / Section</p>
              <p className="font-bold text-slate-800">{student.grade}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Evaluation Date</p>
              <p className="font-mono text-slate-600">{student.date}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Term / Phase</p>
              <p className="font-bold text-slate-800">{student.phase || "Phase 1"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Overall Grade</p>
              <p className="font-mono bg-slate-900 text-white rounded px-1.5 py-0.5 text-[10px] font-black inline-block mt-0.5 w-fit">
                {percentageToLetterGrade(calculateTotalScore(student.scores))}
              </p>
            </div>
          </div>

          {/* Evaluation Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-slate-350 text-slate-700 uppercase font-bold text-[8px] tracking-widest bg-slate-50/50">
                  <th className="py-2 px-2.5 w-5/12">Grading Area Component</th>
                  <th className="py-2 px-2 text-center w-2/12">Rating</th>
                  <th className="py-2 px-2 text-center w-2/12">Post Support</th>
                  <th className="py-2 px-2.5 w-3/12">Educator Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705">
                {(Object.keys(COMPONENT_DETAILS) as ComponentKey[]).map((key) => {
                  const comp = COMPONENT_DETAILS[key];
                  const rawScore = student.scores[key] || 0;
                  const pct = calculatePercentage(rawScore, comp.maxScore);
                  const rating = percentageToRating(pct);

                  return (
                    <tr key={key} className="align-top">
                      <td className="py-2 px-2.5 space-y-0.5">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {comp.name}
                        </span>
                        <span className="text-[9.5px] text-slate-450 block font-normal leading-normal">
                          {comp.description}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center items-center gap-1 font-mono">
                          {[1, 2, 3, 4].map((num) => {
                            const isMatched = num === rating;
                            return (
                              <span
                                key={num}
                                className={`inline-flex items-center justify-center w-4 w-4 h-4 h-4 rounded-full text-[9px] font-bold ${
                                  isMatched
                                    ? "bg-slate-900 text-white font-black"
                                    : "text-slate-200"
                                }`}
                              >
                                {num}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800 text-[9px] font-mono">
                        <span className="inline-block px-1 py-0.2 rounded bg-slate-50 border border-slate-200">
                          {student.afterSupport[key] || "Excellent"}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-[9.5px] text-slate-600 leading-normal font-normal italic">
                        {student.remarks[key] || "No custom remarks shared."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth and Remarks block */}
        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-2.5 space-y-0.5 bg-slate-50/20">
              <h4 className="font-bold uppercase tracking-wide text-blue-600 text-[8.5px] flex items-center gap-1">
                <span className="w-1.2 h-1.2 rounded-full bg-blue-500" />
                Student Computing Strengths
              </h4>
              <p className="text-[9.5px] text-slate-700 leading-relaxed font-normal italic">
                {student.strengths || "The student has demonstrated strong practical engagement during computing lab setups."}
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-2.5 space-y-0.5 bg-slate-50/20">
              <h4 className="font-bold uppercase tracking-wide text-blue-600 text-[8.5px] flex items-center gap-1">
                <span className="w-1.2 h-1.2 rounded-full bg-blue-400" />
                Areas of Growth & Next Steps
              </h4>
              <p className="text-[9.5px] text-slate-700 leading-relaxed font-normal italic">
                {student.areasOfImprovement || "Regular touch typing drills and homework submission revision are recommended."}
              </p>
            </div>
          </div>

          {/* Aggregate metrics */}
          <div className="flex flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-2.5 gap-2 text-xs">
            <div>
              <strong className="block font-bold text-[9px] text-slate-700 uppercase tracking-wider">Overall Academic standing</strong>
              <span className="text-[8px] text-slate-400 font-mono">Calculated over all 5 grading weights (Passing mark: 35%)</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-800 text-[9.5px] font-bold">
                <span>Percentage:</span>
                <span className="font-extrabold">{calculateTotalScore(student.scores)}%</span>
              </div>
              <div className="border-l border-slate-200 pl-3 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${calculateTotalScore(student.scores) >= 35 ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                <strong className={`font-black text-[9px] tracking-wider uppercase ${calculateTotalScore(student.scores) >= 35 ? "text-emerald-700" : "text-rose-600"}`}>
                  {calculateTotalScore(student.scores) >= 35 ? "PASSED ✅" : "FAILED ❌"}
                </strong>
              </div>
            </div>
          </div>

          {/* Evaluator and Parent Signatures */}
          <div className="pt-2 grid grid-cols-2 gap-8 text-[10px] text-slate-900 border-t border-slate-100 pt-3">
            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-widest text-slate-400 text-[8px]">Evaluator Signature</p>
              <div className="border-b border-slate-300 w-full pt-1.5 h-4.5" />
              <p className="text-[9px] font-bold text-slate-900 mt-1">Mr. Sudeep Shrestha (Teacher)</p>
              <p className="text-[9px] font-bold text-slate-400">Date: <span className="font-mono text-slate-900 font-bold">{student.date}</span></p>
            </div>

            <div className="space-y-1">
              <p className="font-extrabold uppercase tracking-widest text-slate-400 text-[8px]">Parent / Guardian Signature</p>
              <div className="border-b border-slate-300 w-full pt-1.5 h-4.5" />
              <p className="text-[9px] font-bold text-slate-400 pt-2 font-mono">Date Checked: __________________</p>
            </div>
          </div>

          {/* Tiny bottom tag */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-mono">
            <span>Form Ref: EDU-CDC-VER2</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
