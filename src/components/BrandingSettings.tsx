import React, { useState, useRef, useEffect } from "react";
import { Upload, Trash2, RotateCcw, Check, Sparkles, Building2, BookOpen } from "lucide-react";

interface BrandingSettingsProps {
  currentSchoolName: string;
  onSchoolNameChange: (name: string) => void;
  onSchoolLogoChange: (logoBase64: string | null) => void;
  onSchoolMottoChange: (motto: string) => void;
  schoolMotto: string;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({
  currentSchoolName,
  onSchoolNameChange,
  onSchoolLogoChange,
  onSchoolMottoChange,
  schoolMotto,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logo from localStorage on mount
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem("school_logo");
      if (savedLogo) {
        setLogoPreview(savedLogo);
      }
    } catch (e) {
      console.error("Failed to load logo from localStorage:", e);
    }
  }, []);

  // Show a momentary save feedback
  const triggerSuccessFeedback = () => {
    setSaveSuccess(true);
    const t = setTimeout(() => setSaveSuccess(false), 2000);
    return () => clearTimeout(t);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file type. Please upload an image (PNG, JPG, SVG, or WEBP).");
      return;
    }

    // Limit size to 3.5MB to ensure it fits in localStorage alongside other data
    if (file.size > 3.5 * 1024 * 1024) {
      setUploadError("Image is too large (Max: 3.5MB) for browser local storage.");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoPreview(result);
        onSchoolLogoChange(result);
        triggerSuccessFeedback();
      }
    };
    reader.onerror = () => {
      setUploadError("Could not read file. Please try a different image.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    onSchoolLogoChange(null);
    triggerSuccessFeedback();
  };

  const handleResetAllBranding = () => {
    if (window.confirm("Are you sure you want to reset all branding configurations (logo, name, slogan) back to default?")) {
      setLogoPreview(null);
      onSchoolLogoChange(null);
      onSchoolNameChange("MOUNT ANNAPURNA SECONDARY SCHOOL");
      onSchoolMottoChange("LOVE TO LEARN - LIVE TO SERVE");
      triggerSuccessFeedback();
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-xl overflow-hidden border border-slate-800 animate-fade-in">
      
      {/* Panel Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            School Branding Configuration
          </span>
        </div>
        {saveSuccess ? (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check className="h-3 w-3" /> Auto-Saved
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-medium">
            Local Persistence Active
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        
        {/* School Name & Motto Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-400" />
              School / Institution Name
            </label>
            <input
              type="text"
              value={currentSchoolName}
              onChange={(e) => {
                onSchoolNameChange(e.target.value.toUpperCase());
                triggerSuccessFeedback();
              }}
              placeholder="e.g. MOUNT ANNAPURNA SECONDARY SCHOOL"
              className="w-full text-xs font-bold border border-slate-800 rounded-lg px-3 py-2 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              Motto or Slogan Text
            </label>
            <input
              type="text"
              value={schoolMotto}
              onChange={(e) => {
                onSchoolMottoChange(e.target.value);
                triggerSuccessFeedback();
              }}
              placeholder="e.g. LOVE TO LEARN - LIVE TO SERVE"
              className="w-full text-xs font-semibold border border-slate-800 rounded-lg px-3 py-2 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="my-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Document Header Logo / Full Photo Banner
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
              💡 Composite Banners Supported
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
            <strong>Composite Image Notice:</strong> If your school logo, name, and motto/slogan are <strong>all in one single photo or image</strong>, simply upload that image below. The application will render your uploaded photo directly as the main header banner, bypassing the text boxes without adding any duplicate text!
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            
            {/* Logo Dropzone & Selector */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`lg:col-span-2 relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-blue-500 bg-blue-500/10 scale-[0.99]" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/70"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <Upload className="h-6 w-6 text-slate-500 mb-2" />
              <p className="text-xs font-bold text-slate-300">
                Drag and drop your school logo here
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports PNG, JPG, SVG or WEBP (Max 3.5MB size)
              </p>
              <button 
                type="button" 
                className="mt-2.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors"
              >
                Browse File
              </button>
            </div>

            {/* Logo Current Box with checkered visual transparency */}
            <div className="border border-slate-850 bg-slate-950/80 rounded-xl p-3 flex flex-col justify-between items-center text-center min-h-[120px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Logo Output Preview
              </span>
              
              <div 
                className="my-2 p-2 rounded-lg relative overflow-hidden flex items-center justify-center w-full h-16"
                style={{
                  backgroundImage: "conic-gradient(#1e293b 0.25turn, #0f172a 0.25turn 0.5turn, #1e293b 0.5turn 0.75turn, #0f172a 0.75turn)",
                  backgroundSize: "12px 12px",
                }}
              >
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Custom Uploaded Logo" 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-slate-500 font-semibold flex flex-col items-center">
                    <span className="text-amber-500 font-bold block">Vector SVG Fallback</span>
                    <span>No custom logo set</span>
                  </div>
                )}
              </div>

              {logoPreview ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove Custom Logo</span>
                </button>
              ) : (
                <span className="text-[9px] text-slate-500 italic">
                  Showing default emblem logo
                </span>
              )}
            </div>

          </div>
        </div>

        {uploadError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed">
            ⚠️ {uploadError}
          </div>
        )}

        {/* Global branding reset */}
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-500 font-medium">
            Custom values automatically load everywhere (A4 PDF page, marks sheet, student previews).
          </p>
          <button
            type="button"
            onClick={handleResetAllBranding}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

      </div>
    </div>
  );
};
