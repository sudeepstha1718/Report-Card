import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Sparkles, 
  Download, 
  Printer, 
  Search, 
  Sliders, 
  UserPlus, 
  CheckCircle,
  HelpCircle,
  Clock,
  Eye,
  EyeOff,
  Minimize2,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  School,
  Calendar,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { StudentRecord, COMPONENT_DETAILS, ComponentKey, ScoreComponents } from "./types";
import { 
  calculatePercentage, 
  percentageToRating, 
  ratingToDescriptor, 
  percentageToLetterGrade, 
  calculateTotalScore, 
  generateDefaultRemarks, 
  exportToClassroomExcel 
} from "./lib/gradeUtils";

// @ts-ignore
import html2pdf from "html2pdf.js";
import { PrintPreviewPage } from "./components/PrintPreviewPage";

// Mock student template data for instant load and testing
const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "CS-401",
    name: "Sudeep Shrestha",
    grade: "Class 4A",
    phase: "Phase 1",
    rollNo: "1",
    date: "2026-06-11",
    evaluator: "Mr. Sudeep Shrestha",
    scores: {
      participation: 9,
      homework: 8,
      mcq: 24,
      project: 28,
      lab: 18
    },
    afterSupport: {
      participation: "Excellent",
      homework: "Very Good",
      mcq: "Satisfactory",
      project: "Very Good",
      lab: "Very Good"
    },
    remarks: {
      participation: "Highly active participant; regularly volunteers for hardware setup demonstrations and answers computer security questions.",
      homework: "Consistently submits well-organized worksheets on time; showcases perfect files and directories categorization.",
      mcq: "Demonstrates strong conceptual retention about input/output devices and safe online habits during quizzes.",
      project: "Created an outstanding game build in Scratch featuring advanced sound effects and custom key-event variables.",
      lab: "Possesses rapid typing speed (30+ WPM) and navigates files structures easily."
    },
    strengths: "Sudeep exhibits outstanding algorithmic logic in Scratch creation, is highly skilled at handling OS shortcuts, and assists classmates with lab tasks.",
    areasOfImprovement: "Can practice extra binary conversion drills to ensure high scores on theoretical papers, and consider exploring nested control loops."
  },
  {
    id: "CS-402",
    name: "Prerna Shakya",
    grade: "Class 4A",
    phase: "Phase 1",
    rollNo: "2",
    date: "2026-06-11",
    evaluator: "Mr. Sudeep Shrestha",
    scores: {
      participation: 8,
      homework: 7,
      mcq: 20,
      project: 23,
      lab: 15
    },
    afterSupport: {
      participation: "Very Good",
      homework: "Very Good",
      mcq: "Very Good",
      project: "Very Good",
      lab: "Very Good"
    },
    remarks: {
      participation: "Eager learner; maintains good focus in class and contributes productively to team layout design.",
      homework: "Submissions are generally complete and show a effort to practice outside of class hours.",
      mcq: "Understands fundamental hardware components, but sometimes mixes up system software vs application software.",
      project: "Designed a clean, storytelling-themed animation project with beautiful custom backdrop vector graphics.",
      lab: "Shows confidence when saving and storing files in cloud folders."
    },
    strengths: "Prerna has strong creative instincts in program layout design, demonstrates disciplined attention to class guidelines, and completes logical workflows.",
    areasOfImprovement: "To advance further, Prerna should practice keyboard touch-typing drills regularly to increase overall word-per-minute speed and accuracy."
  },
  {
    id: "CS-403",
    name: "Aayush Thapa",
    grade: "Class 4A",
    phase: "Phase 1",
    rollNo: "3",
    date: "2026-06-11",
    evaluator: "Mr. Sudeep Shrestha",
    scores: {
      participation: 5,
      homework: 4,
      mcq: 13,
      project: 14,
      lab: 9
    },
    afterSupport: {
      participation: "Satisfactory",
      homework: "Needs Improvement",
      mcq: "Needs Improvement",
      project: "Satisfactory",
      lab: "Needs Improvement"
    },
    remarks: {
      participation: "Requires frequent prompts during lecture, as she gets distracted by online browser software.",
      homework: "Needs reminders to write up homework worksheets; completed two out of five tasks this season.",
      mcq: "Finds computing terms like algorithms and RAM slightly confusing; needs review worksheets.",
      project: "A simple project with essential commands. Good effort, but logic flow needed close guidance to compile.",
      lab: "Needs help double-clicking files and organizing custom folder paths."
    },
    strengths: "Aayush has an active imagination and shows good enthusiasm during practical, game-based learning hours.",
    areasOfImprovement: "Requires continuous practice on keyboard keys layout, completing assignment printouts, and utilizing standard directories properly."
  }
];

export default function App() {
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem("edugrade_students");
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.length > 0 ? students[0].id : ""
  );

  const ALLOWED_CLASSES = ["Class 3A", "Class 3B", "Class 4A", "Class 4B", "Class 5A", "Class 5B"];
  const ALLOWED_PHASES = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  const [classFilter, setClassFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [workspaceTab, setWorkspaceTab] = useState<"editor" | "report">("editor");
  const [editorMode, setEditorMode] = useState<"matrix" | "single">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [parentViewMode, setParentViewMode] = useState(true); // Hide raw numbers from form by default
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("Class 4A");
  const [newStudentPhase, setNewStudentPhase] = useState("Phase 1");
  const [newStudentRollNo, setNewStudentRollNo] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [schoolName, setSchoolName] = useState("BORCELLE SCHOOL OF COMPUTING");
  const [statusMessage, setStatusMessage] = useState("");

  const activeStudent = students.find((s) => s.id === selectedStudentId);

  // --- STANDALONE UN-SANDBOXED PRINT PREVIEW ROUTE ---
  const isPrintPreviewRoute = window.location.pathname.startsWith("/print-preview/");
  if (isPrintPreviewRoute) {
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    const previewStudent = students.find((s) => s.id === id);
    const params = new URLSearchParams(window.location.search);
    const mode = (params.get("mode") || "print") as "print" | "download";
    
    return (
      <PrintPreviewPage 
        student={previewStudent} 
        mode={mode} 
        schoolName={schoolName} 
      />
    );
  }

  // Persistence
  useEffect(() => {
    localStorage.setItem("edugrade_students", JSON.stringify(students));
  }, [students]);

  const [isIframe, setIsIframe] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  const triggerStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleScoreChange = (key: ComponentKey, value: number) => {
    if (!activeStudent) return;
    
    // Validate score boundaries
    const max = COMPONENT_DETAILS[key].maxScore;
    const clamped = Math.max(0, Math.min(max, value));

    const updatedStudents = students.map((s) => {
      if (s.id === activeStudent.id) {
        const nextScores = { ...s.scores, [key]: clamped };
        // Auto update remarks matching score performance bands
        const autoRemarks = generateDefaultRemarks(nextScores);
        return {
          ...s,
          scores: nextScores,
          remarks: {
            ...s.remarks,
            [key]: autoRemarks[key]
          }
        };
      }
      return s;
    });

    setStudents(updatedStudents);
  };

  const handleAfterSupportChange = (key: ComponentKey, val: string) => {
    if (!activeStudent) return;
    setStudents(
      students.map((s) => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            afterSupport: {
              ...s.afterSupport,
              [key]: val
            }
          };
        }
        return s;
      })
    );
  };

  const handleCustomRemarksChange = (key: ComponentKey, val: string) => {
    if (!activeStudent) return;
    setStudents(
      students.map((s) => {
        if (s.id === activeStudent.id) {
          return {
            ...s,
            remarks: {
              ...s.remarks,
              [key]: val
            }
          };
        }
        return s;
      })
    );
  };

  const handleStudentFieldChange = (field: keyof StudentRecord, val: any) => {
    if (!activeStudent) return;
    setStudents(
      students.map((s) => {
        if (s.id === activeStudent.id) {
          return { ...s, [field]: val };
        }
        return s;
      })
    );
  };

  const handleStudentFieldChangeInList = (studentId: string, field: keyof StudentRecord, val: any) => {
    setStudents(
      students.map((s) => {
        if (s.id === studentId) {
          return { ...s, [field]: val };
        }
        return s;
      })
    );
  };

  const handleScoreChangeInList = (studentId: string, key: ComponentKey, value: number) => {
    const max = COMPONENT_DETAILS[key].maxScore;
    const clamped = Math.max(0, Math.min(max, value));

    setStudents(
      students.map((s) => {
        if (s.id === studentId) {
          const nextScores = { ...s.scores, [key]: clamped };
          return {
            ...s,
            scores: nextScores,
            remarks: {
              ...s.remarks,
              [key]: generateDefaultRemarks(nextScores)[key]
            }
          };
        }
        return s;
      })
    );
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newId = `CS-${Date.now().toString().slice(-4)}`;
    const standardScores: ScoreComponents = {
      participation: 8,
      homework: 8,
      mcq: 22,
      project: 22,
      lab: 14
    };

    const newRec: StudentRecord = {
      id: newId,
      name: newStudentName,
      grade: newStudentGrade,
      phase: newStudentPhase,
      rollNo: newStudentRollNo.trim() || (students.length + 1).toString(),
      date: new Date().toISOString().substring(0, 10),
      evaluator: "Mr. Sudeep Shrestha",
      scores: standardScores,
      afterSupport: {
        participation: "Excellent",
        homework: "Excellent",
        mcq: "Excellent",
        project: "Excellent",
        lab: "Excellent"
      },
      remarks: generateDefaultRemarks(standardScores),
      strengths: `${newStudentName} shows strong active cooperation during computer laboratory tasks and handles basic program commands with confidence.`,
      areasOfImprovement: `Encouraged to practice keyboard focus exercises regularly to boost confidence and secure higher results in concept evaluations.`
    };

    const newList = [...students, newRec];
    setStudents(newList);
    setSelectedStudentId(newId);
    setNewStudentName("");
    setNewStudentRollNo("");
    setIsAddingStudent(false);
    triggerStatus(`Successfully enrolled student ${newRec.name}`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely erase ${name} from classroom roster?`)) {
      const filtered = students.filter((s) => s.id !== id);
      setStudents(filtered);
      if (selectedStudentId === id) {
        setSelectedStudentId(filtered.length > 0 ? filtered[0].id : "");
      }
      triggerStatus(`Removed ${name} from class ledger`);
    }
  };

  // Call the server-side Gemini API proxy to generate intelligent evaluations
  const generateCommentsWithGemini = async () => {
    if (!activeStudent) return;
    setIsAiLoading(true);
    triggerStatus("Consulting AI Evaluation Assistant...");
    
    try {
      const response = await fetch("/api/generate-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeStudent.name,
          grade: activeStudent.grade,
          scores: activeStudent.scores
        })
      });

      const data = await response.json();
      if (data && (data.strengths || data.areasOfImprovement)) {
        setStudents(
          students.map((s) => {
            if (s.id === activeStudent.id) {
              return {
                ...s,
                strengths: data.strengths || s.strengths,
                areasOfImprovement: data.areasOfImprovement || s.areasOfImprovement
              };
            }
            return s;
          })
        );
        triggerStatus("AI successfully compiled custom Strengths & Improvement Areas!");
      } else {
        throw new Error("Empty response schema returned.");
      }
    } catch (e) {
      console.error(e);
      triggerStatus("AI service is offline, local rules have been applied.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const downloadExcel = () => {
    exportToClassroomExcel(students);
    triggerStatus("Class ledger Excel sheet generated successfully!");
  };

  const printReport = (mode: "print" | "download" = "print") => {
    if (!activeStudent) return;
    
    // Save latest state to localStorage so the preview tab reads the most up-to-date inputs
    try {
      localStorage.setItem("edugrade_students", JSON.stringify(students));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
    
    // Construct preview URL targeting our un-sandboxed print route
    const url = `/print-preview/${activeStudent.id}?mode=${mode}`;
    
    triggerStatus(`Spawning high-fidelity tab to print/download ${activeStudent.name}'s report...`);
    
    // Open in separate browser context (bypasses iframe sandboxing completely)
    window.open(url, "_blank");
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo && s.rollNo.toString().toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesClass = classFilter === "all" || s.grade === classFilter;
    const matchesPhase = phaseFilter === "all" || (s.phase || "Phase 1") === phaseFilter;
    return matchesSearch && matchesClass && matchesPhase;
  });

  const renderStudentRoster = (compact: boolean = false) => {
    if (filteredStudents.length === 0) {
      return (
        <div className="py-12 px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">No student records found matching search query.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-150 bg-white">
        {filteredStudents.map((st) => {
          const studentTotal = calculateTotalScore(st.scores);
          const isSelected = st.id === selectedStudentId;
          const finalRating = percentageToRating(studentTotal);
          return (
            <div
              key={st.id}
              onClick={() => setSelectedStudentId(st.id)}
              className={`flex justify-between items-center p-4 cursor-pointer transition-all hover:bg-slate-50 border-l-4 ${
                isSelected ? "bg-blue-50/50 border-blue-600 font-bold" : "border-transparent"
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-xs text-slate-900 truncate ${isSelected ? "font-extrabold" : "font-semibold"}`}>{st.name}</h3>
                  {st.rollNo && (
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100/70 px-1.5 py-0.5 rounded font-mono font-bold">
                      Roll: {st.rollNo}
                    </span>
                  )}
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                    {st.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{st.grade} · {st.phase || "Phase 1"}</p>
              </div>
              
              {!compact && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black block text-slate-900">
                      Rating {finalRating}
                    </span>
                    <span className="text-[10px] text-slate-505 font-mono">
                      Score: {studentTotal}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStudent(st.id, st.name);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Student"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {compact && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white">
                    {percentageToLetterGrade(studentTotal)}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? "text-blue-500 translate-x-0.5" : "text-slate-300"}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      
      {/* Dynamic Status Alert Bar */}
      {statusMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-slate-700 animate-slide-in font-medium transition-all text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Roster Header Banner */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md border-b border-slate-850 gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Computer Science Assessment Portal</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
              EduGrade Evaluation Hub
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button 
            id="btn-excel-export"
            onClick={downloadExcel} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700/65 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Master Excel</span>
          </button>
          
          <button
            id="btn-download-pdf"
            onClick={() => printReport("download")}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700/65 transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>

          <button
            id="btn-print-action"
            onClick={() => printReport("print")}
            className="flex items-center gap-2 bg-blue-650 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-900/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </header>

      {/* Sub-header Platform Workspace Tabs */}
      <div className="bg-slate-900/10 border-b border-slate-250 py-3 px-6 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden shadow-sm z-30 bg-white">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setWorkspaceTab("editor")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workspaceTab === "editor" 
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 border border-slate-900" 
                : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-blue-500" />
            <span>✏️ Marks & Remarks Matrix Editor</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (!activeStudent && students.length > 0) {
                setSelectedStudentId(students[0].id);
              }
              setWorkspaceTab("report");
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workspaceTab === "report" 
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 border border-slate-900" 
                : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-500" />
            <span>📄 Print Official A4 Report Card</span>
          </button>
        </div>

        {activeStudent && (
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span>Evaluating Record:</span>
            <span className="font-extrabold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-lg">
              {activeStudent.name} ({activeStudent.grade} · {activeStudent.phase || "Phase 1"})
            </span>
          </div>
        )}
      </div>

      {/* Core Split Screen Working Platform */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden print:overflow-visible">
        
        {/* Left Side: Interactive Roster Ledger / Marks Loader */}
        <section className={`bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto print:hidden transition-all duration-300 ${
          workspaceTab === "editor" ? "w-full" : "w-full lg:w-3/12"
        }`}>
          
          {/* Section 1: Dashboard stats & Search bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex justify-between items-center gap-2 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Class Performance Overview</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {students.length} <span className="text-sm font-medium text-slate-500">Students Loaded</span>
                  </h2>
                </div>
              </div>

              <button
                id="btn-trigger-student-add"
                onClick={() => setIsAddingStudent(!isAddingStudent)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Student</span>
              </button>
            </div>

            {/* Quick Add Student Panel */}
            {isAddingStudent && (
              <form onSubmit={handleAddStudent} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm mb-4 animate-fade-in">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Enrol New Student</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                    <input
                      id="input-[student-name]"
                      type="text"
                      required
                      placeholder="e.g. Sudeep Shrestha"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Roll Number</label>
                    <input
                      id="input-[student-rollno]"
                      type="text"
                      placeholder="e.g. 1"
                      value={newStudentRollNo}
                      onChange={(e) => setNewStudentRollNo(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Grade / Class</label>
                    <select
                      id="input-[student-grade]"
                      value={newStudentGrade}
                      onChange={(e) => setNewStudentGrade(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    >
                      {ALLOWED_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Term / Phase</label>
                    <select
                      id="input-[student-phase]"
                      value={newStudentPhase}
                      onChange={(e) => setNewStudentPhase(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    >
                      {ALLOWED_PHASES.map((ph) => (
                        <option key={ph} value={ph}>{ph}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-add-submit"
                    type="submit"
                    className="bg-blue-600 text-white font-bold rounded-lg px-4 py-1.5 cursor-pointer hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100"
                  >
                    Enrol Student
                  </button>
                </div>
              </form>
            )}

             {/* Live Search and Filters */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Search students by name, ID, class, or phase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-205 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Class & Phase Roster Filter Bar */}
            <div className="mb-3 space-y-3 bg-white p-3 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Filter Students by Grade / Class
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setClassFilter("all")}
                    className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                      classFilter === "all"
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All ({students.length})
                  </button>
                  {ALLOWED_CLASSES.map((cls) => {
                    const count = students.filter((s) => s.grade === cls).length;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setClassFilter(cls)}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                          classFilter === cls
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {cls.replace("Class ", "")} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Filter Students by Assessment Phase
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setPhaseFilter("all")}
                    className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                      phaseFilter === "all"
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All Phases ({students.length})
                  </button>
                  {ALLOWED_PHASES.map((ph) => {
                    const count = students.filter((s) => (s.phase || "Phase 1") === ph).length;
                    return (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => setPhaseFilter(ph)}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                          phaseFilter === ph
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {ph.replace("Phase ", "P")} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Search / Filter Tally */}
              <div className="text-[10px] text-slate-400 font-bold pt-1.5 flex justify-between items-center border-t border-slate-100">
                <span>Active Search/Filter Result:</span>
                <span className="font-mono bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">
                  {filteredStudents.length} Students Included
                </span>
              </div>
            </div>

            {/* Workplace Selector Switch */}
            <div className="inline-flex w-full bg-slate-105 p-1 rounded-xl border border-slate-200 mt-1">
              <button
                type="button"
                onClick={() => setEditorMode("matrix")}
                className={`flex-1 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === "matrix"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>📊 Class Grid Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("single")}
                className={`flex-1 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === "single"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>👤 Detailed Remarks</span>
              </button>
            </div>
          </div>

          {workspaceTab === "editor" ? (
            editorMode === "matrix" ? (
              <div className="flex-1 flex flex-col bg-white">
                {/* Responsive Spreadsheet Grid */}
                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[400px]">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-100 text-[9px] uppercase font-black tracking-wider text-slate-600 border-b border-slate-200 z-15">
                      <tr>
                        <th className="py-2.5 px-3 text-left w-36">Student Name</th>
                        <th className="py-2.5 px-2 text-left w-16">Roll No</th>
                        <th className="py-2.5 px-2 text-left w-24">Class</th>
                        <th className="py-2.5 px-2 text-left w-20">Phase</th>
                        <th className="py-2.5 px-2 text-center w-12" title="Participation (Max 10)">Part (10)</th>
                        <th className="py-2.5 px-2 text-center w-12" title="Homework Sheets (Max 10)">HW (10)</th>
                        <th className="py-2.5 px-2 text-center w-12" title="MCQ Theoretical (Max 30)">MCQ (30)</th>
                        <th className="py-2.5 px-2 text-center w-12" title="Practical Project (Max 30)">Proj (30)</th>
                        <th className="py-2.5 px-2 text-center w-12" title="Computer Lab (Max 20)">Lab (20)</th>
                        <th className="py-2.5 px-2 text-center w-12">Total</th>
                        <th className="py-2.5 px-3 text-center w-10">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredStudents.map((st) => {
                        const total = calculateTotalScore(st.scores);
                        const isSelected = st.id === selectedStudentId;
                        const letterGrade = percentageToLetterGrade(total);

                        return (
                          <tr
                            key={st.id}
                            onClick={() => setSelectedStudentId(st.id)}
                            className={`transition-colors cursor-pointer text-xs ${
                              isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/60"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-600" : "bg-transparent"}`} />
                              <input
                                type="text"
                                value={st.name}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "name", e.target.value)}
                                className="bg-transparent text-xs text-slate-800 font-bold border-b border-transparent focus:border-blue-500 focus:bg-white focus:outline-none p-0.5 rounded transition w-full"
                              />
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                placeholder="R-"
                                value={st.rollNo || ""}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "rollNo", e.target.value)}
                                className="bg-transparent text-xs font-mono text-slate-800 font-bold border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-0.5 rounded transition w-12 text-center"
                              />
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={st.grade}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "grade", e.target.value)}
                                className="bg-transparent hover:bg-slate-100 text-slate-800 font-semibold p-1 pr-3 text-xs focus:outline-none rounded border border-transparent border-b-slate-100 focus:border-blue-300 text-[11px]"
                              >
                                {ALLOWED_CLASSES.map((cls) => (
                                  <option key={cls} value={cls}>{cls}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={st.phase || "Phase 1"}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "phase", e.target.value)}
                                className="bg-transparent hover:bg-slate-100 text-slate-800 font-semibold p-1 pr-3 text-xs focus:outline-none rounded border border-transparent border-b-slate-100 focus:border-blue-300 text-[11px]"
                              >
                                {ALLOWED_PHASES.map((ph) => (
                                  <option key={ph} value={ph}>{ph}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={st.scores.participation}
                                onChange={(e) => handleScoreChangeInList(st.id, "participation", parseInt(e.target.value) || 0)}
                                className="w-10 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={st.scores.homework}
                                onChange={(e) => handleScoreChangeInList(st.id, "homework", parseInt(e.target.value) || 0)}
                                className="w-10 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={st.scores.mcq}
                                onChange={(e) => handleScoreChangeInList(st.id, "mcq", parseInt(e.target.value) || 0)}
                                className="w-11 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                max="30"
                                value={st.scores.project}
                                onChange={(e) => handleScoreChangeInList(st.id, "project", parseInt(e.target.value) || 0)}
                                className="w-11 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={st.scores.lab}
                                onChange={(e) => handleScoreChangeInList(st.id, "lab", parseInt(e.target.value) || 0)}
                                className="w-11 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="font-mono font-extrabold text-[10px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                {total} ({letterGrade})
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="text-slate-350 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Student"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-blue-50/55 border-t border-slate-150 text-[10.5px] text-blue-700 font-medium leading-relaxed">
                  🚀 <strong>Automatic Saving Matrix:</strong> Typing scores immediately re-computes Nepal standards and updates the official portrait transcript on the right!
                </div>
              </div>
            ) : (
              // Two column editor layout for single student editing!
              <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-white">
                <div className="w-full md:w-3/12 border-b md:border-b-0 md:border-r border-slate-205 overflow-y-auto max-h-[250px] md:max-h-none h-full bg-slate-50/15">
                  <div className="bg-slate-100/70 px-4 py-2.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider border-b border-slate-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                    <span>Student Roster</span>
                    <span className="bg-slate-200 text-slate-705 px-1.5 py-0.5 rounded font-mono text-[9px]">{filteredStudents.length}</span>
                  </div>
                  {renderStudentRoster(true)}
                </div>

                <div className="flex-1 overflow-y-auto bg-white">
                  {activeStudent ? (
                <div className="p-4 sm:p-5 flex-1 space-y-6">
                  
                  <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Evaluation</span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{activeStudent.name}</h3>
                    </div>
                    {/* View toggles to explain conversion */}
                    <div className="text-xs flex items-center gap-1">
                      <span className="text-slate-400 font-semibold">View Mode:</span>
                      <button
                        type="button"
                        onClick={() => setParentViewMode(!parentViewMode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          parentViewMode 
                            ? "bg-blue-650 text-white border-blue-650 shadow-sm shadow-blue-100" 
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Toggle disclosures of raw scores on the parent evaluation sheet"
                      >
                        {parentViewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span>{parentViewMode ? "Official Parent 1-4" : "Detailed Teacher Marks"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Roster Demographics Updates */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Roll Number</label>
                      <input
                        type="text"
                        value={activeStudent.rollNo || ""}
                        onChange={(e) => handleStudentFieldChange("rollNo", e.target.value)}
                        className="w-full text-xs font-extrabold bg-transparent border-b border-slate-250 focus:border-blue-500 focus:outline-none py-0.5 text-slate-800 transition"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Class / Grade</label>
                      <select
                        value={activeStudent.grade}
                        onChange={(e) => handleStudentFieldChange("grade", e.target.value)}
                        className="w-full text-xs font-bold bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none py-0.5 text-slate-700 transition cursor-pointer"
                      >
                        {ALLOWED_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Term / Phase</label>
                      <select
                        value={activeStudent.phase || "Phase 1"}
                        onChange={(e) => handleStudentFieldChange("phase", e.target.value)}
                        className="w-full text-xs font-bold bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none py-0.5 text-slate-700 transition cursor-pointer"
                      >
                        {ALLOWED_PHASES.map((ph) => (
                          <option key={ph} value={ph}>{ph}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 pt-1 border-t border-slate-100 mt-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Evaluator / Instructor Name</label>
                      <p className="w-full text-xs font-bold text-slate-700 py-1 bg-slate-100/50 px-2 rounded">
                        Mr. Sudeep Shrestha
                      </p>
                    </div>
                  </div>

                  {/* 5 Raw Components Interactive Entry Slider & Inputs */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Enter Raw Performance Marks</span>
                      <span className="text-[10px] font-normal lowercase italic text-slate-400">Calculates 1-4 Band immediately</span>
                    </h4>

                    {(Object.keys(COMPONENT_DETAILS) as ComponentKey[]).map((key) => {
                      const comp = COMPONENT_DETAILS[key];
                      const rawScore = activeStudent.scores[key] || 0;
                      const pct = calculatePercentage(rawScore, comp.maxScore);
                      const rating = percentageToRating(pct);

                      return (
                        <div key={key} className="p-4 bg-white border border-slate-205 rounded-xl space-y-3 transition-all hover:shadow-sm hover:border-blue-400">
                          <div className="flex justify-between items-start gap-1">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{comp.name}</h5>
                              <p className="text-[10px] text-slate-400">Out of {comp.maxScore} marks · (Weight: {comp.maxScore}%)</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-slate-900 font-mono bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-md">
                                {rawScore} / {comp.maxScore}
                              </span>
                            </div>
                          </div>

                          {/* Score range slider */}
                          <div className="flex items-center gap-3">
                            <input
                              id={`slider-${key}`}
                              type="range"
                              min="0"
                              max={comp.maxScore}
                              step="1"
                              value={rawScore}
                              onChange={(e) => handleScoreChange(key, parseInt(e.target.value) || 0)}
                              className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-[11px] font-bold text-slate-500 font-mono w-8 text-right">
                              {pct}%
                            </span>
                          </div>

                          {/* Display automatically computed band scale */}
                          <div className="flex flex-wrap items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-medium">
                            <span className="text-slate-600">
                              Rating: <strong className="text-blue-600 font-mono text-xs">{rating}</strong>
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Support:</span>
                              <select
                                id={`support-${key}`}
                                value={activeStudent.afterSupport[key] || "Excellent"}
                                onChange={(e) => handleAfterSupportChange(key, e.target.value)}
                                className="bg-slate-50 text-[10px] font-bold border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 transition"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Very Good">Very Good</option>
                                <option value="Satisfactory">Satisfactory</option>
                                <option value="Needs Improvement">Needs Improvement</option>
                              </select>
                            </div>
                          </div>

                          {/* Component Custom Commendations Textbox */}
                          <div className="pt-1">
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Parent Report Card Remark for this Specific Component</label>
                            <textarea
                              id={`remarks-${key}`}
                              rows={1}
                              placeholder="Provide custom component observations here..."
                              value={activeStudent.remarks[key] || ""}
                              onChange={(e) => handleCustomRemarksChange(key, e.target.value)}
                              className="w-full text-xs border border-slate-205 rounded-lg p-2 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 leading-relaxed font-normal transition"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strengths & Weaknesses Comment Writers + Gemini trigger */}
                  <div className="space-y-4 border-t border-slate-200 pt-5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Report Summary & Growth Comments</h4>
                      <button
                        type="button"
                        onClick={generateCommentsWithGemini}
                        disabled={isAiLoading}
                        className="flex items-center gap-1 bg-blue-650 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-100"
                      >
                        <Sparkles className={`h-3 w-3 ${isAiLoading ? "animate-spin text-amber-300 font-bold" : "text-amber-400 font-bold"}`} />
                        <span>{isAiLoading ? "Generating comments..." : "AI Auto-Write Remarks"}</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex justify-between">
                          <span>Interactive Key Strengths</span>
                          <span className="text-[10px] text-slate-400 font-normal">Parent-facing transcript summary</span>
                        </label>
                        <textarea
                          id="text-strengths"
                          rows={2}
                          value={activeStudent.strengths || ""}
                          onChange={(e) => handleStudentFieldChange("strengths", e.target.value)}
                          placeholder="e.g. Sudeep exhibits excellent attention during coding tasks and leads the classroom..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 leading-relaxed font-normal shadow-inner transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex justify-between">
                          <span>Development / Areas for Improvement</span>
                          <span className="text-[10px] text-slate-400 font-normal">Next pedagogical actions</span>
                        </label>
                        <textarea
                          id="text-[areasOfImprovement]"
                          rows={2}
                          value={activeStudent.areasOfImprovement || ""}
                          onChange={(e) => handleStudentFieldChange("areasOfImprovement", e.target.value)}
                          placeholder="e.g. Needs to focus on submitting worksheets on time and practices touch-typing exercises..."
                          className="w-full text-xs border border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 leading-relaxed font-normal shadow-inner transition"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700 leading-relaxed shadow-sm">
                      <h3 className="text-blue-800 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <span>💡 Performance Logic Breakdown</span>
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3 text-[11px] font-medium text-blue-700">
                        <li>• <strong className="text-blue-900 font-bold">Band 4:</strong> Outstanding (90%+)</li>
                        <li>• <strong className="text-blue-900 font-bold">Band 3:</strong> Very Good (70-89%)</li>
                        <li>• <strong className="text-blue-900 font-bold">Band 2:</strong> Good (50-69%)</li>
                        <li>• <strong className="text-blue-900 font-bold">Band 1:</strong> Average (Below 50%)</li>
                      </ul>
                      <p className="mt-2 text-[10px] opacity-80 border-t border-blue-200/50 pt-2 leading-relaxed">
                        System auto-recalculates parent ratings, aligns progress descriptors, and fits everything inside the print-preview dynamically.
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <UserPlus className="h-10 w-10 mx-auto opacity-40 mb-3" />
                  <p className="font-medium text-sm">Enroll students to begin evaluation files.</p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // In Report mode, the Left Side merely contains the student list scrolling, allowing switching between cards:
        <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in">
              <div className="bg-slate-100/70 px-4 py-2.5 text-[10px] font-bold text-slate-550 uppercase tracking-wider border-b border-slate-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <span>Select Student to Preview</span>
                <span className="bg-slate-200 text-slate-705 px-1.5 py-0.5 rounded font-mono text-[9px]">{filteredStudents.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {renderStudentRoster(true)}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center font-medium">
                💡 Click a student to load their physical A4 transcript on the right side workspace.
              </div>
            </div>
          )}

        </section>

        {/* Right Side: Elegant "BORCELLE" Visual Portrait Transcript Preview */}
        <section className="flex-1 bg-slate-100 p-3 sm:p-6 md:p-8 overflow-y-auto flex justify-center items-start print:bg-white print:p-0 print:overflow-visible">
          
          {activeStudent ? (
            <div className="w-full max-w-[800px] flex flex-col gap-4">
              
              {/* Instructions banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-850 flex items-center gap-3 shadow-sm print:hidden">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Interactive Print Preview Studio</p>
                    <p className="text-[11px] text-amber-700/95 mt-0.5 leading-relaxed">
                      This beautifully styled sheet matches the standard single-page Borcelle transcript. Toggle <strong className="font-extrabold text-slate-900">Official Parent View</strong> to hide internal raw marks. Click <strong className="font-extrabold text-slate-900">"Download PDF"</strong> or <strong className="font-extrabold text-slate-900">"Print Report"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* PRINT CONTROLS FOR CHROMIUM DUMP */}
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 0 !important;
                  }
                  html, body, #root {
                    width: 210mm !important;
                    height: 297mm !important;
                    overflow: hidden !important;
                    background-color: #ffffff !important;
                    color: #000000 !important;
                  }
                  /* Hide all non-printable items */
                  header, nav, aside, section:first-of-type, .print\\:hidden, [id^="btn-"], .bg-amber-50, div.fixed, footer {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
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
                    padding: 14mm 15mm !important;
                    margin: 0 !important;
                    border: none !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                    background-color: #ffffff !important;
                  }
                }
                
                /* Strict A4 Styling for downloaded/generated PDFs */
                .pdf-export-mode {
                  width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  max-height: 297mm !important;
                  padding: 12mm 15mm !important;
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
                
                @media screen {
                  .pdf-export-mode {
                    position: fixed !important;
                    left: 10000px !important; /* Render offscreen so browser layout is unaffected */
                    top: 0 !important;
                    z-index: -100 !important;
                  }
                }
              `}</style>

              {/* The Evaluation Form Page Canvas */}
              <div 
                id="printable-report-card" 
                className={`bg-white text-slate-900 flex flex-col justify-between transition-all ${
                  isPdfExporting 
                    ? "pdf-export-mode" 
                    : "rounded-xl shadow-2xl border border-slate-300 p-6 sm:p-10 min-h-[980px] print:shadow-none print:border-none print:rounded-none"
                }`}
              >
                
                {/* BORCELLE Style Header */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <School className="h-6 w-6 text-slate-900 stroke-[2.5]" />
                        <span className="font-black text-xl tracking-tight text-slate-900 font-mono">
                          <input
                            id="edit-school-name"
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value.toUpperCase())}
                            className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none uppercase font-extrabold"
                            style={{ width: "320px" }}
                          />
                        </span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Official Performance Ledger</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Evaluation Report
                      </h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono">
                        Subject: Computer Science
                      </p>
                    </div>
                  </div>

                  {/* Candidate Info Grid / Student Info Grid */}
                  <div className="bg-slate-50/80 rounded-lg p-3.5 grid grid-cols-3 gap-y-2.5 gap-x-4 border border-slate-200/80 text-xs shadow-inner">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Student Name</p>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activeStudent.name}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Roll Number</p>
                      <p className="font-extrabold text-blue-700 mt-0.5 font-mono text-sm">{activeStudent.rollNo || "—"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Grade / Section</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeStudent.grade}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Evaluation Date</p>
                      <p className="font-mono text-slate-805 mt-0.5">{activeStudent.date}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Term / Phase</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeStudent.phase || "Phase 1"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Overall Grade</p>
                      <p className="mt-0.5 text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                        <span className="font-mono bg-slate-900 text-white rounded px-2 py-0.5 text-xs font-black">
                          {percentageToLetterGrade(calculateTotalScore(activeStudent.scores))}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Core Components Evaluation Table */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 uppercase font-bold text-[9px] tracking-widest bg-slate-50/80">
                          <th className="py-2 px-3 w-5/12">Grading Area Component</th>
                          <th className="py-2 px-2 text-center w-2/12">Rating</th>
                          <th className="py-2 px-2 text-center w-2/12">Post Support</th>
                          <th className="py-2 px-3 w-3/12">Educator Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(Object.keys(COMPONENT_DETAILS) as ComponentKey[]).map((key) => {
                          const comp = COMPONENT_DETAILS[key];
                          const rawScore = activeStudent.scores[key] || 0;
                          const pct = calculatePercentage(rawScore, comp.maxScore);
                          const rating = percentageToRating(pct);

                          return (
                            <tr key={key} className="align-top hover:bg-slate-50/20">
                              <td className="py-2.5 px-3 space-y-1">
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {comp.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-normal leading-tight">
                                  {comp.description}
                                </span>
                                {!parentViewMode && (
                                  <span className="inline-block text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1">
                                    Raw: {rawScore}/{comp.maxScore} ({pct}%)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <div className="flex justify-center items-center gap-1.5 font-mono">
                                  {[1, 2, 3, 4].map((num) => {
                                    const isMatched = num === rating;
                                    return (
                                      <span
                                        key={num}
                                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                                          isMatched
                                            ? "bg-slate-900 text-white font-black"
                                            : "text-slate-300"
                                        }`}
                                      >
                                        {num}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-slate-800 text-[10px] font-mono">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
                                  {activeStudent.afterSupport[key] || "Excellent"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[10.5px] text-slate-600 leading-normal font-normal italic">
                                {activeStudent.remarks[key] || "No customized comments provided."}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Growth and Comments blocks */}
                <div className="space-y-3.5 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-lg p-3 space-y-1 bg-slate-50/30">
                      <h4 className="font-bold uppercase tracking-wide text-blue-600 text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Student Computing Strengths
                      </h4>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-normal italic">
                        {activeStudent.strengths || "The student has demonstrated strong practical engagement during computing lab setups."}
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 space-y-1 bg-slate-50/30">
                      <h4 className="font-bold uppercase tracking-wide text-blue-600 text-[10px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Areas of Growth & Next Steps
                      </h4>
                      <p className="text-[11px] text-slate-700 leading-relaxed font-normal italic">
                        {activeStudent.areasOfImprovement || "Regular touch typing drills and homework submission revision are recommended."}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Stand & Level */}
                  <div className="flex flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-3 gap-2 text-xs">
                    <div>
                      <strong className="block font-bold text-[10.5px] text-slate-700 uppercase tracking-wider">Overall Academic standing</strong>
                      <span className="text-[10px] text-slate-400 font-mono">Calculated over all 5 grading weights (Passing mark: 35%)</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 font-mono text-slate-805 font-bold">
                        <span>Percentage:</span>
                        <span className="font-extrabold">{calculateTotalScore(activeStudent.scores)}%</span>
                      </div>
                      <div className="border-l border-slate-200 pl-4 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${calculateTotalScore(activeStudent.scores) >= 35 ? "bg-emerald-500" : "bg-rose-500 animate-pulse"}`} />
                        <strong className={`font-black text-xs tracking-wider uppercase ${calculateTotalScore(activeStudent.scores) >= 35 ? "text-emerald-700" : "text-rose-600"}`}>
                          {calculateTotalScore(activeStudent.scores) >= 35 ? "PASSED ✅" : "FAILED ❌"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Teacher & Parent Signature Section */}
                  <div className="pt-4 grid grid-cols-2 gap-8 text-xs text-slate-900">
                    <div className="space-y-2">
                      <p className="font-extrabold uppercase tracking-widest text-slate-900 text-[9px]">Evaluator Signature</p>
                      <div className="border-b border-slate-350 w-full pt-2 h-5" />
                      <p className="text-[10px] font-bold text-slate-900">Mr. Sudeep Shrestha (Teacher)</p>
                      <p className="text-[10px] font-bold text-slate-500">Date: <span className="font-mono text-slate-900">{activeStudent.date}</span></p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-extrabold uppercase tracking-widest text-slate-900 text-[9px]">Parent / Guardian Signature</p>
                      <div className="border-b border-slate-350 w-full pt-2 h-5" />
                      <p className="text-[10px] font-bold text-slate-500 pt-2.5">Date Checked: __________________</p>
                    </div>
                  </div>

                  {/* PDF Tiny Footer bar */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
                    <span />
                    <span>Page 1 of 1</span>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl text-center text-slate-400 w-full max-w-[500px] border border-slate-200">
              <School className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">No Student Selected</h3>
              <p className="text-xs text-slate-400 mt-1">Please select an active student or enroll a new one to generate evaluation worksheets.</p>
            </div>
          )}

        </section>

      </main>

      {/* Roster Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-3.5 px-6 text-xs text-center flex flex-col sm:flex-row justify-between gap-3 print:hidden">
        <div>
          <span>© 2026 EduGrade Software Inc. Continuous grading aligns strictly with central CDC rating policies.</span>
        </div>
        <div className="flex justify-center gap-4 text-[11px] font-medium">
          <span className="text-slate-500">System Clock: 2026 UTC</span>
          <span className="text-slate-500 font-mono">1 = Beginner, 4 = Excellent Scale</span>
        </div>
      </footer>

    </div>
  );
}
