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
  AlertTriangle,
  Lock,
  ShieldAlert,
  ArrowRight,
  CornerDownLeft
} from "lucide-react";
import { StudentRecord, COMPONENT_DETAILS, ComponentKey, ScoreComponents } from "./types";
import { 
  calculatePercentage, 
  percentageToRating, 
  ratingToDescriptor, 
  percentageToLetterGrade, 
  calculateTotalScore, 
  generateDefaultRemarks, 
  generateDefaultStrengthsAndImprovements,
  exportToClassroomExcel 
} from "./lib/gradeUtils";

// @ts-ignore
import html2pdf from "html2pdf.js";
import { PrintPreviewPage } from "./components/PrintPreviewPage";
import { SchoolLogo } from "./components/SchoolLogo";
import { BrandingSettings } from "./components/BrandingSettings";
import { CLASS_3_STUDENTS } from "./class3Data";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return sessionStorage.getItem("edugrade_authenticated") === "true";
      }
    } catch (e) {}
    return false;
  });
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    // 1. Try opener's localStorage (highly likely since spawned by window.open)
    try {
      if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
        const openerSaved = window.opener.localStorage.getItem("edugrade_students");
        if (openerSaved) {
          const parsed = JSON.parse(openerSaved);
          // If stored records lack Class 3A or Class 3B, or only contain a single phase (53 students), force update to complete list
          const hasNew = parsed.some((s: any) => s.grade === "Class 3A" || s.grade === "Class 3B");
          const hasAllPhases = parsed.length >= 150;
          if (!hasNew || !hasAllPhases) {
            return CLASS_3_STUDENTS;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read from window.opener localStorage", e);
    }
    // 2. Try own localStorage
    try {
      const saved = localStorage.getItem("edugrade_students");
      if (saved) {
        const parsed = JSON.parse(saved);
        // If stored records lack Class 3A or Class 3B, or only contain a single phase, force update
        const hasNew = parsed.some((s: any) => s.grade === "Class 3A" || s.grade === "Class 3B");
        const hasAllPhases = parsed.length >= 150;
        if (!hasNew || !hasAllPhases) {
          localStorage.setItem("edugrade_students", JSON.stringify(CLASS_3_STUDENTS));
          return CLASS_3_STUDENTS;
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read from own localStorage", e);
    }
    // 3. Fallback
    return CLASS_3_STUDENTS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return students.length > 0 ? students[0].id : "";
  });

  // Keep selectedStudentId in sync with students when list loads or changes
  useEffect(() => {
    if (students.length > 0) {
      // If current selected student isn't in the loaded list, select the first student
      if (!students.some(s => s.id === selectedStudentId)) {
        setSelectedStudentId(students[0].id);
      }
    } else {
      setSelectedStudentId("");
    }
  }, [students, selectedStudentId]);

  const [ALLOWED_CLASSES, setAllowedClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("edugrade_allowed_classes");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ["Class 3A", "Class 3B"];
  });

  const [ALLOWED_BATCHES, setAllowedBatches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("edugrade_allowed_batches");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ["2083 BS", "2082 BS"];
  });

  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAddBatchForm, setShowAddBatchForm] = useState(false);

  const [showSidebarClassInput, setShowSidebarClassInput] = useState(false);
  const [showSidebarBatchInput, setShowSidebarBatchInput] = useState(false);
  const [sidebarClassText, setSidebarClassText] = useState("");
  const [sidebarBatchText, setSidebarBatchText] = useState("");

  const handleAddCustomClass = (newClass: string) => {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (ALLOWED_CLASSES.includes(trimmed)) {
      triggerStatus(`⚠️ Class ${trimmed} already exists.`);
      return;
    }
    const updated = [...ALLOWED_CLASSES, trimmed];
    setAllowedClasses(updated);
    localStorage.setItem("edugrade_allowed_classes", JSON.stringify(updated));
    triggerStatus(`🎉 Added custom Class: ${trimmed}`);
    setShowAddClassForm(false);
  };

  const handleAddCustomBatch = (newBatch: string) => {
    const trimmed = newBatch.trim();
    if (!trimmed) return;
    if (ALLOWED_BATCHES.includes(trimmed)) {
      triggerStatus(`⚠️ Batch ${trimmed} already exists.`);
      return;
    }
    const updated = [...ALLOWED_BATCHES, trimmed];
    setAllowedBatches(updated);
    localStorage.setItem("edugrade_allowed_batches", JSON.stringify(updated));
    triggerStatus(`🎉 Added custom Academic Batch: ${trimmed}`);
    setShowAddBatchForm(false);
  };

  const ALLOWED_PHASES = ["Phase 1", "Phase 2", "Phase 3", "Phase 4"];

  const [classFilter, setClassFilter] = useState<string>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [workspaceTab, setWorkspaceTab] = useState<"editor" | "report" | "branding">("editor");
  const [editorMode, setEditorMode] = useState<"matrix" | "single">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [parentViewMode, setParentViewMode] = useState(true); // Hide raw numbers from form by default
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("Class 3A");
  const [newStudentPhase, setNewStudentPhase] = useState("Phase 1");
  const [newStudentRollNo, setNewStudentRollNo] = useState("");
  const [newStudentBatch, setNewStudentBatch] = useState("2083 BS");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const [schoolName, setSchoolName] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.opener && !window.opener.closed) {
          const openerSchool = window.opener.localStorage.getItem("edugrade_schoolName");
          if (openerSchool) {
            if (openerSchool.toUpperCase().includes("BORCELLE")) {
              return "MOUNT ANNAPURNA SECONDARY SCHOOL";
            }
            return openerSchool;
          }
        }
        const saved = localStorage.getItem("edugrade_schoolName");
        if (saved) {
          if (saved.toUpperCase().includes("BORCELLE")) {
            localStorage.setItem("edugrade_schoolName", "MOUNT ANNAPURNA SECONDARY SCHOOL");
            return "MOUNT ANNAPURNA SECONDARY SCHOOL";
          }
          return saved;
        }
      }
    } catch (e) {}
    return "MOUNT ANNAPURNA SECONDARY SCHOOL";
  });

  const [schoolMotto, setSchoolMotto] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.opener && !window.opener.closed) {
          const openerMotto = window.opener.localStorage.getItem("edugrade_schoolMotto");
          if (openerMotto) {
            if (openerMotto.toUpperCase().includes("BORCELLE")) {
              return "LOVE TO LEARN - LIVE TO SERVE";
            }
            return openerMotto;
          }
        }
        const saved = localStorage.getItem("edugrade_schoolMotto");
        if (saved) {
          if (saved.toUpperCase().includes("BORCELLE")) {
            localStorage.setItem("edugrade_schoolMotto", "LOVE TO LEARN - LIVE TO SERVE");
            return "LOVE TO LEARN - LIVE TO SERVE";
          }
          return saved;
        }
      }
    } catch (e) {}
    return "LOVE TO LEARN - LIVE TO SERVE";
  });

  const [schoolLogo, setSchoolLogo] = useState<string | null>(() => {
    try {
      if (typeof window !== "undefined") {
        if (window.opener && !window.opener.closed) {
          const openerLogo = window.opener.localStorage.getItem("school_logo");
          if (openerLogo) return openerLogo;
        }
        const saved = localStorage.getItem("school_logo");
        if (saved) return saved;
      }
    } catch (e) {}
    return null;
  });

  const [statusMessage, setStatusMessage] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNo && s.rollNo.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesClass = classFilter === "all" || s.grade === classFilter;
    const matchesPhase = phaseFilter === "all" || (s.phase || "Phase 1") === phaseFilter;
    const matchesBatch = batchFilter === "all" || (s.batch || "2083 BS") === batchFilter;
    return matchesSearch && matchesClass && matchesPhase && matchesBatch;
  });

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
        motto={schoolMotto}
        logoUrl={schoolLogo}
      />
    );
  }

  // Persistence (Auto-saving is disabled per user request. Saving is done manually via Save Changes click or Ctrl+S)

  // Listen for storage changes in other tabs/windows to keep all views completely consistent
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === "edugrade_students" && e.newValue) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setStudents(parsed);
          }
        }
        if (e.key === "edugrade_schoolName" && e.newValue !== null) {
          setSchoolName(e.newValue);
        }
        if (e.key === "edugrade_schoolMotto" && e.newValue !== null) {
          setSchoolMotto(e.newValue);
        }
        if (e.key === "school_logo") {
          setSchoolLogo(e.newValue);
        }
      } catch (err) {
        console.warn("Storage sync error", err);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  const handleManualSaveAll = (customMsg?: string) => {
    try {
      localStorage.setItem("edugrade_students", JSON.stringify(students));
      localStorage.setItem("edugrade_schoolName", schoolName);
      localStorage.setItem("edugrade_schoolMotto", schoolMotto);
      if (schoolLogo) {
        localStorage.setItem("school_logo", schoolLogo);
      } else {
        localStorage.removeItem("school_logo");
      }
      setHasUnsaved(false);
      triggerStatus(customMsg || "🎉 Saved all progress successfully & permanently!");
    } catch (e) {
      console.error("Local storage save error:", e);
      triggerStatus("⚠️ Failed to save. Local storage might be full or restricted.");
    }
  };

  useEffect(() => {
    const handleShortcutKeys = (e: KeyboardEvent) => {
      // Check for Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSaveAll();
      }
      
      // Check for Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        printReport("print");
      }
    };
    
    window.addEventListener("keydown", handleShortcutKeys);
    return () => window.removeEventListener("keydown", handleShortcutKeys);
  }, [students, schoolName, schoolMotto, schoolLogo, activeStudent]);

  const handleKeyDownInMatrix = (
    e: React.KeyboardEvent<any>,
    studentId: string,
    field: string
  ) => {
    const listFieldsInOrder = [
      "name",
      "rollNo",
      "grade",
      "phase",
      "batch",
      "participation",
      "homework",
      "mcq",
      "project",
      "lab"
    ];
    const colIndex = listFieldsInOrder.indexOf(field);

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const sIndex = filteredStudents.findIndex((st) => st.id === studentId);
      if (sIndex > 0) {
        const prevStudent = filteredStudents[sIndex - 1];
        setSelectedStudentId(prevStudent.id);
        setTimeout(() => {
          const targetInput = document.getElementById(`input-${prevStudent.id}-${field}`);
          if (targetInput) {
            targetInput.focus();
            if (targetInput instanceof HTMLInputElement) {
              targetInput.select();
            }
          }
        }, 10);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const sIndex = filteredStudents.findIndex((st) => st.id === studentId);
      if (sIndex !== -1 && sIndex < filteredStudents.length - 1) {
        const nextStudent = filteredStudents[sIndex + 1];
        setSelectedStudentId(nextStudent.id);
        setTimeout(() => {
          const targetInput = document.getElementById(`input-${nextStudent.id}-${field}`);
          if (targetInput) {
            targetInput.focus();
            if (targetInput instanceof HTMLInputElement) {
              targetInput.select();
            }
          }
        }, 10);
      }
    } else if (e.key === "ArrowLeft") {
      if (colIndex > 0) {
        e.preventDefault();
        const prevField = listFieldsInOrder[colIndex - 1];
        setTimeout(() => {
          const targetInput = document.getElementById(`input-${studentId}-${prevField}`);
          if (targetInput) {
            targetInput.focus();
            if (targetInput instanceof HTMLInputElement) {
              targetInput.select();
            }
          }
        }, 10);
      }
    } else if (e.key === "ArrowRight") {
      if (colIndex !== -1 && colIndex < listFieldsInOrder.length - 1) {
        e.preventDefault();
        const nextField = listFieldsInOrder[colIndex + 1];
        setTimeout(() => {
          const targetInput = document.getElementById(`input-${studentId}-${nextField}`);
          if (targetInput) {
            targetInput.focus();
            if (targetInput instanceof HTMLInputElement) {
              targetInput.select();
            }
          }
        }, 10);
      }
    }
  };

  useEffect(() => {
    const handleGlobalNavigation = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const sIndex = filteredStudents.findIndex((st) => st.id === selectedStudentId);
        if (sIndex > 0) {
          setSelectedStudentId(filteredStudents[sIndex - 1].id);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const sIndex = filteredStudents.findIndex((st) => st.id === selectedStudentId);
        if (sIndex !== -1 && sIndex < filteredStudents.length - 1) {
          setSelectedStudentId(filteredStudents[sIndex + 1].id);
        }
      }
    };
    
    window.addEventListener("keydown", handleGlobalNavigation);
    return () => window.removeEventListener("keydown", handleGlobalNavigation);
  }, [filteredStudents, selectedStudentId]);

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
        // Auto update evaluation scale matching the score band rating
        const nextPct = calculatePercentage(clamped, max);
        const nextRating = percentageToRating(nextPct);
        const nextRatingDesc = ratingToDescriptor(nextRating);
        const nextAfterSupport = { ...s.afterSupport, [key]: nextRatingDesc };
        // Auto update student general strengths and improvements in real-time
        const autoFeedback = generateDefaultStrengthsAndImprovements(nextScores);

        return {
          ...s,
          scores: nextScores,
          afterSupport: nextAfterSupport,
          remarks: {
            ...s.remarks,
            [key]: autoRemarks[key]
          },
          strengths: autoFeedback.strengths,
          areasOfImprovement: autoFeedback.areasOfImprovement
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    setHasUnsaved(true);
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
    setHasUnsaved(true);
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
    setHasUnsaved(true);
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
    setHasUnsaved(true);
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
    setHasUnsaved(true);
  };

  const handleScoreChangeInList = (studentId: string, key: ComponentKey, value: number) => {
    const max = COMPONENT_DETAILS[key].maxScore;
    const clamped = Math.max(0, Math.min(max, value));

    setStudents(
      students.map((s) => {
        if (s.id === studentId) {
          const nextScores = { ...s.scores, [key]: clamped };
          const autoRemarks = generateDefaultRemarks(nextScores);
          const nextPct = calculatePercentage(clamped, max);
          const nextRating = percentageToRating(nextPct);
          const nextRatingDesc = ratingToDescriptor(nextRating);
          const nextAfterSupport = { ...s.afterSupport, [key]: nextRatingDesc };
          const autoFeedback = generateDefaultStrengthsAndImprovements(nextScores);

          return {
            ...s,
            scores: nextScores,
            afterSupport: nextAfterSupport,
            remarks: {
              ...s.remarks,
              [key]: autoRemarks[key]
            },
            strengths: autoFeedback.strengths,
            areasOfImprovement: autoFeedback.areasOfImprovement
          };
        }
        return s;
      })
    );
    setHasUnsaved(true);
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
      batch: newStudentBatch.trim() || "2083 BS",
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
    setHasUnsaved(true);
    triggerStatus(`Successfully enrolled student ${newRec.name}`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setStudentToDelete({ id, name });
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const { id, name } = studentToDelete;
    const filtered = students.filter((s) => s.id !== id);
    setStudents(filtered);
    if (selectedStudentId === id) {
      setSelectedStudentId(filtered.length > 0 ? filtered[0].id : "");
    }
    setHasUnsaved(true);
    triggerStatus(`Removed ${name} from class ledger`);
    setStudentToDelete(null);
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
        setHasUnsaved(true);
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

  if (!isAuthenticated && !isPrintPreviewRoute) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Obfuscated Base64 decoder: "MTEyMQ==" decodes to "1121"
      if (btoa(pinInput) === "MTEyMQ==") {
        setIsAuthenticated(true);
        sessionStorage.setItem("edugrade_authenticated", "true");
        setPinError(false);
      } else {
        setPinError(true);
        setPinInput("");
      }
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-8 flex flex-col gap-6 relative z-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-[1.5px]">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Lock className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">EduGrade Central Ledger</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium max-w-[300px]">
                Authorized CDC Centralized Administration and Marks Ledger System
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span>Enter Authority PIN</span>
                <span className="text-[10px] text-slate-500 font-normal normal-case">(Set up by local instruction rules)</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ""));
                    setPinError(false);
                  }}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center tracking-[1.5em] text-lg font-black bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 focus:outline-none p-3.5 rounded-xl text-emerald-400 placeholder-slate-700 transition-all font-mono"
                />
              </div>
              {pinError && (
                <span className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mt-1.5 animate-pulse">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>Access Denied. Incorrect Security PIN code.</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-40 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Unlock Authorities</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 text-center">
            <span className="text-[10px] text-slate-500 font-medium">
              Continuous grading aligns strictly with CDC regulatory grading metrics
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-200">
      
      {/* Dynamic Status Alert Bar */}
      {statusMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-slate-700 animate-slide-in font-medium transition-all text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Custom Safe Deletion Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden animate-fade-in">
          <div 
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6 flex flex-col gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                  Erase Student Record?
                </h3>
                <p className="text-xs text-slate-400 font-medium">This operation is permanent</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              Are you completely sure you want to delete <strong className="text-slate-900 font-extrabold">{studentToDelete.name}</strong> from the classroom ledger? This will permanently erase their exam scores, lab metrics, and generated remarks.
            </p>

            <div className="flex justify-end items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-605 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel, Keep Record
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/10 transition-all cursor-pointer"
              >
                Yes, Erase Record
              </button>
            </div>
          </div>
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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

          <button
            type="button"
            onClick={() => setWorkspaceTab("branding")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              workspaceTab === "branding" 
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/15 border border-slate-900" 
                : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Settings className="h-3.5 w-3.5 text-amber-500" />
            <span>🏫 School Logo & Branding</span>
          </button>
        </div>

        {activeStudent ? (
          <div className="text-xs font-semibold text-slate-600 flex flex-wrap items-center gap-2">
            <span>Evaluating Record:</span>
            <span className="font-extrabold bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-lg">
              {activeStudent.name} ({activeStudent.grade} · {activeStudent.phase || "Phase 1"})
            </span>

            {hasUnsaved ? (
              <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-600 bg-amber-50 border border-amber-150 rounded-lg px-2.5 py-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
                <span>Unsaved (Ctrl+S)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Saved</span>
              </div>
            )}

            <button
              id="btn-manual-save"
              type="button"
              onClick={() => handleManualSaveAll()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ml-2 mr-1 animate-fade-in"
              title="Manually save all current changes instantly"
            >
              <CheckCircle className="h-3 w-3" />
              <span>Save Changes</span>
            </button>
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            {hasUnsaved ? (
              <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-600 bg-amber-50 border border-amber-150 rounded-lg px-2.5 py-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
                <span>Unsaved (Ctrl+S)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Saved</span>
              </div>
            )}

            <button
              id="btn-manual-save-global"
              type="button"
              onClick={() => handleManualSaveAll()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm animate-fade-in"
              title="Manually save all current changes instantly"
            >
              <CheckCircle className="h-3 w-3" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {/* Core Split Screen Working Platform */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden print:overflow-visible relative">
        
        {workspaceTab === "branding" && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-55/90 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 md:p-8 z-30 flex justify-center items-start print:hidden">
            <div className="w-full max-w-4xl space-y-6">
              
              {/* Educational Advisory Slate */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800 shadow-xl">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-amber-500" />
                    <span>School Identity & Logo Configurator</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                    Set up your institution's name, slogan / motto, and logo image. This configuration persists inside your browser and instantly format scales across all student transcripts, spreadsheet matrices, and A4 print files.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("editor")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Go To Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceTab("report")}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Preview PDF Transcript</span>
                  </button>
                </div>
              </div>

              <BrandingSettings
                currentSchoolName={schoolName}
                onSchoolNameChange={(val) => {
                  setSchoolName(val);
                  setHasUnsaved(true);
                }}
                onSchoolLogoChange={(newLogo) => {
                  setSchoolLogo(newLogo);
                  setHasUnsaved(true);
                  if (newLogo) {
                    localStorage.setItem("school_logo", newLogo);
                  } else {
                    localStorage.removeItem("school_logo");
                  }
                }}
                onSchoolMottoChange={(val) => {
                  setSchoolMotto(val);
                  setHasUnsaved(true);
                }}
                schoolMotto={schoolMotto}
              />
              
              {/* Branding Live Preview Sheet Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">
                  Branding Application Preview (Live Document Header Look)
                </span>
                
                <div className="border border-slate-200/80 rounded-xl p-4 sm:p-6 bg-slate-50/50">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="w-full max-w-[620px] overflow-hidden">
                      <SchoolLogo 
                        className="h-16 w-auto" 
                        schoolName={schoolName}
                        motto={schoolMotto}
                        logoUrl={schoolLogo}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-blue-700 bg-blue-50/80 border border-blue-100 rounded px-2.5 py-1">
                        Active Header Setup
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}
        
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
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3">
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Grade / Class</label>
                      <button
                        type="button"
                        onClick={() => setShowAddClassForm(!showAddClassForm)}
                        className="text-blue-600 hover:text-blue-800 p-0.5 rounded cursor-pointer hover:bg-slate-150 transition"
                        title="Add Custom Class Grade"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="relative">
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
                      {showAddClassForm && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 p-2 rounded-lg shadow-lg z-50 flex gap-2 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. Class 3C"
                            id="new-class-input"
                            className="text-xs border border-slate-200 rounded px-2 py-1 w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = document.getElementById("new-class-input") as HTMLInputElement;
                                if (input && input.value) {
                                  handleAddCustomClass(input.value);
                                  setNewStudentGrade(input.value.trim());
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById("new-class-input") as HTMLInputElement;
                              if (input && input.value) {
                                handleAddCustomClass(input.value);
                                setNewStudentGrade(input.value.trim());
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded transition"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
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
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase">Batch</label>
                      <button
                        type="button"
                        onClick={() => setShowAddBatchForm(!showAddBatchForm)}
                        className="text-amber-600 hover:text-amber-800 p-0.5 rounded cursor-pointer hover:bg-slate-150 transition"
                        title="Add Custom Academic Batch"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="relative">
                      <select
                        id="input-[student-batch]"
                        value={newStudentBatch}
                        onChange={(e) => setNewStudentBatch(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                      >
                        {ALLOWED_BATCHES.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      {showAddBatchForm && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 p-2 rounded-lg shadow-lg z-50 flex gap-2 animate-fade-in">
                          <input
                            type="text"
                            placeholder="e.g. 2083 BS"
                            id="new-batch-input"
                            className="text-xs border border-slate-200 rounded px-2 py-1 w-full text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-550 font-semibold"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const input = document.getElementById("new-batch-input") as HTMLInputElement;
                                if (input && input.value) {
                                  handleAddCustomBatch(input.value);
                                  setNewStudentBatch(input.value.trim());
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById("new-batch-input") as HTMLInputElement;
                              if (input && input.value) {
                                handleAddCustomBatch(input.value);
                                setNewStudentBatch(input.value.trim());
                              }
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-2 py-1 rounded transition"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Filter Students by Grade / Class
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSidebarClassInput(!showSidebarClassInput)}
                    className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-slate-100 transition"
                    title="Add Custom Grade / Class"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                {showSidebarClassInput && (
                  <div className="flex gap-1.5 py-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="e.g. Class 3C"
                      value={sidebarClassText}
                      onChange={(e) => setSidebarClassText(e.target.value)}
                      className="text-xs border border-slate-200 rounded px-2.5 py-1 w-full text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomClass(sidebarClassText);
                          setSidebarClassText("");
                          setShowSidebarClassInput(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddCustomClass(sidebarClassText);
                        setSidebarClassText("");
                        setShowSidebarClassInput(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      Save
                    </button>
                  </div>
                )}
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

              {(() => {
                const uniqueBatches = Array.from(new Set(students.map((s) => s.batch || "2083 BS").filter(Boolean)));
                const allBatchOptions = Array.from(new Set([...ALLOWED_BATCHES, ...uniqueBatches]));
                return (
                  <div className="space-y-1 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Filter Students by Academic Batch
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSidebarBatchInput(!showSidebarBatchInput)}
                        className="text-amber-600 hover:text-amber-800 p-0.5 rounded hover:bg-slate-100 transition"
                        title="Add Custom Academic Batch"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {showSidebarBatchInput && (
                      <div className="flex gap-1.5 py-1 animate-fade-in">
                        <input
                          type="text"
                          placeholder="e.g. 2083 BS"
                          value={sidebarBatchText}
                          onChange={(e) => setSidebarBatchText(e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2.5 py-1 w-full text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 bg-slate-50 focus:bg-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomBatch(sidebarBatchText);
                              setSidebarBatchText("");
                              setShowSidebarBatchInput(false);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleAddCustomBatch(sidebarBatchText);
                            setSidebarBatchText("");
                            setShowSidebarBatchInput(false);
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-lg transition"
                        >
                          Save
                        </button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setBatchFilter("all")}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                          batchFilter === "all"
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        All Batches
                      </button>
                      {allBatchOptions.map((b) => {
                        const count = students.filter((s) => (s.batch || "2083 BS") === b).length;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBatchFilter(b)}
                            className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                              batchFilter === b
                                ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {b} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              
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
                        <th className="py-2.5 px-2 text-left w-20">Batch</th>
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
                                id={`input-${st.id}-name`}
                                type="text"
                                value={st.name}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "name")}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "name", e.target.value)}
                                className="bg-transparent text-xs text-slate-800 font-bold border-b border-transparent focus:border-blue-500 focus:bg-white focus:outline-none p-0.5 rounded transition w-full"
                              />
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-rollNo`}
                                type="text"
                                placeholder="R-"
                                value={st.rollNo || ""}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "rollNo")}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "rollNo", e.target.value)}
                                className="bg-transparent text-xs font-mono text-slate-800 font-bold border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-0.5 rounded transition w-12 text-center"
                              />
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                id={`input-${st.id}-grade`}
                                value={st.grade}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "grade")}
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
                                id={`input-${st.id}-phase`}
                                value={st.phase || "Phase 1"}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "phase")}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "phase", e.target.value)}
                                className="bg-transparent hover:bg-slate-100 text-slate-800 font-semibold p-1 pr-3 text-xs focus:outline-none rounded border border-transparent border-b-slate-100 focus:border-blue-300 text-[11px]"
                              >
                                {ALLOWED_PHASES.map((ph) => (
                                  <option key={ph} value={ph}>{ph}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-batch`}
                                type="text"
                                value={st.batch || "2083 BS"}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "batch")}
                                onChange={(e) => handleStudentFieldChangeInList(st.id, "batch", e.target.value)}
                                className="bg-transparent text-xs text-slate-800 font-bold border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-0.5 rounded transition w-16 text-center"
                                placeholder="eg. 2083"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-participation`}
                                type="number"
                                min="0"
                                max="10"
                                value={st.scores.participation}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "participation")}
                                onChange={(e) => handleScoreChangeInList(st.id, "participation", parseInt(e.target.value) || 0)}
                                className="w-10 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-homework`}
                                type="number"
                                min="0"
                                max="10"
                                value={st.scores.homework}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "homework")}
                                onChange={(e) => handleScoreChangeInList(st.id, "homework", parseInt(e.target.value) || 0)}
                                className="w-10 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-mcq`}
                                type="number"
                                min="0"
                                max="30"
                                value={st.scores.mcq}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "mcq")}
                                onChange={(e) => handleScoreChangeInList(st.id, "mcq", parseInt(e.target.value) || 0)}
                                className="w-11 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-project`}
                                type="number"
                                min="0"
                                max="30"
                                value={st.scores.project}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "project")}
                                onChange={(e) => handleScoreChangeInList(st.id, "project", parseInt(e.target.value) || 0)}
                                className="w-11 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded py-0.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none text-[11px]"
                              />
                            </td>
                            <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                id={`input-${st.id}-lab`}
                                type="number"
                                min="0"
                                max="20"
                                value={st.scores.lab}
                                onKeyDown={(e) => handleKeyDownInMatrix(e, st.id, "lab")}
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
                  <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
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
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400">Batch Year</label>
                      <input
                        type="text"
                        value={activeStudent.batch || "2083 BS"}
                        onChange={(e) => handleStudentFieldChange("batch", e.target.value)}
                        className="w-full text-xs font-extrabold bg-transparent border-b border-slate-250 focus:border-blue-500 focus:outline-none py-0.5 text-slate-800 transition"
                        placeholder="e.g. 2083 BS"
                      />
                    </div>
                    <div className="col-span-4 pt-1 border-t border-slate-100 mt-1">
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
                              <span className="text-slate-400">Evaluation:</span>
                              <select
                                id={`support-${key}`}
                                value={activeStudent.afterSupport[key] || "Excellent"}
                                onChange={(e) => handleAfterSupportChange(key, e.target.value)}
                                className="bg-slate-50 text-[10px] font-bold border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 transition"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Very Good">Very Good</option>
                                <option value="Good">Good</option>
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

                    {/* Highly accessible physical Save Changes Button with reassuring sound/feedback behavior */}
                    <div className="pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        id="btn-form-manual-save"
                        onClick={() => {
                          handleManualSaveAll(`🎉 Saved all changes for ${activeStudent.name} permanently!`);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 px-4 rounded-xl shadow-md shadow-emerald-100 hover:shadow-emerald-200 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Save Student Changes</span>
                      </button>
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

        {/* Right Side: Elegant "Mount Annapurna" Visual Portrait Transcript Preview */}
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
                      This beautifully styled sheet matches the standard single-page Mount Annapurna transcript. Toggle <strong className="font-extrabold text-slate-900">Official Parent View</strong> to hide internal raw marks. Click <strong className="font-extrabold text-slate-900">"Download PDF"</strong> or <strong className="font-extrabold text-slate-900">"Print Report"</strong>.
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
                
                {/* Mount Annapurna Style Header */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b-2 border-slate-900 pb-4">
                    <div className="w-full sm:max-w-[480px] md:max-w-[520px] overflow-hidden">
                      <SchoolLogo 
                        className="h-14 sm:h-16 w-auto" 
                        schoolName={schoolName}
                        motto={schoolMotto}
                        logoUrl={schoolLogo}
                      />
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                        Evaluation Report
                      </h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 font-mono">
                        Subject: Computer Science
                      </p>
                    </div>
                  </div>

                  {/* Candidate Info Grid / Student Info Grid */}
                  <div className="bg-slate-50/80 rounded-lg p-3.5 grid grid-cols-4 gap-y-2.5 gap-x-4 border border-slate-200/80 text-xs shadow-inner">
                    <div className="col-span-2">
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
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Academic Batch</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{activeStudent.batch || "2083 BS"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Term / Phase</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeStudent.phase || "Phase 1"}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Evaluation Date</p>
                      <p className="font-mono text-slate-805 mt-0.5">{activeStudent.date}</p>
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

                  {/* Evaluation Criteria Descriptor Box */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-200 pb-3">
                    <div className="text-xs space-y-1.5 md:col-span-2">
                      <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Academic Grading Level Standards</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-[8.5px] leading-tight">
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">A+</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(90%+)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Outstanding</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">A</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(80-89%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Excellent</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">B+</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(70-79%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Very Good</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">B</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(60-69%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Good</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">C+</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(50-59%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Satisfactory</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">C</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(40-49%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Acceptable</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">D</strong>
                          <span className="text-slate-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(35-39%)</span>
                          <span className="text-slate-400 block text-[7.5px] mt-auto">Basic</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 text-center flex flex-col justify-between h-full">
                          <strong className="text-slate-900 block font-black text-[10px]">NG</strong>
                          <span className="text-rose-500 block font-semibold font-mono text-[8.5px] leading-none my-0.5">(&lt;35%)</span>
                          <span className="text-rose-500 block text-[7.5px] mt-auto font-bold">Ungraded</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Evaluation Rating Scale Legends</h3>
                      <div className="grid grid-cols-2 gap-1 text-[9px] leading-tight">
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[8.5px] font-mono">4</span>
                          <span className="text-slate-700 font-semibold ml-1">Excellent</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[8.5px] font-mono">3</span>
                          <span className="text-slate-700 font-semibold ml-1">Very Good</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[8.5px] font-mono">2</span>
                          <span className="text-slate-700 font-semibold ml-1">Satisfactory</span>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[8.5px] font-mono">1</span>
                          <span className="text-slate-700 font-semibold ml-1">Needs Improvement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Components Evaluation Table */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-700 uppercase font-bold text-[9px] tracking-widest bg-slate-50/80">
                          <th className="py-2 px-3 w-5/12">Grading Area Component</th>
                          <th className="py-2 px-2 text-center w-2/12">Rating</th>
                          <th className="py-2 px-2 text-center w-2/12">Evaluation Scale</th>
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
                                        className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[10.5px] font-bold border transition ${
                                          isMatched
                                            ? "bg-slate-900 text-white border-slate-900 font-extrabold shadow-sm"
                                            : "bg-transparent text-slate-300 border-slate-100"
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
        <div className="flex justify-center items-center gap-4 text-[11px] font-medium">
          {hasUnsaved ? (
            <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-bold uppercase tracking-wider text-[9px] shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Unsaved Changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold uppercase tracking-wider text-[9px] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All Changes Saved</span>
            </div>
          )}
          <span className="text-slate-550">System Clock: 2026 UTC</span>
          <span className="text-slate-550 font-mono">1 = Beginner, 4 = Excellent Scale</span>
        </div>
      </footer>

    </div>
  );
}
