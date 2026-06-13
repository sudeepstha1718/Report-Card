import React, { useState, useEffect } from "react";

interface SchoolLogoProps {
  className?: string;
  style?: React.CSSProperties;
  schoolName?: string;
  motto?: string;
  logoUrl?: string | null;
}

const CANDIDATES = [
  "/logo.png",
  "/logo.jpg",
  "/logo.jpeg",
  "/logo.webp",
  "/src/assets/logo.png",
  "/src/assets/logo.jpg"
];

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ 
  className, 
  style,
  schoolName: propSchoolName,
  motto: propMotto,
  logoUrl: propLogoUrl
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [candidateError, setCandidateError] = useState(false);
  const [customLogoError, setCustomLogoError] = useState(false);

  // States to force synchronization on storage changes
  const [localLogo, setLocalLogo] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string>("MOUNT ANNAPURNA SECONDARY SCHOOL");
  const [localMotto, setLocalMotto] = useState<string>("LOVE TO LEARN - LIVE TO SERVE");

  // Read configurations dynamically
  useEffect(() => {
    const updateBranding = () => {
      try {
        let logo = localStorage.getItem("school_logo");
        let name = localStorage.getItem("edugrade_schoolName");
        let motto = localStorage.getItem("edugrade_schoolMotto");

        if (typeof window !== "undefined" && window.opener && !window.opener.closed) {
          const opLogo = window.opener.localStorage.getItem("school_logo");
          const opName = window.opener.localStorage.getItem("edugrade_schoolName");
          const opMotto = window.opener.localStorage.getItem("edugrade_schoolMotto");
          if (opLogo) logo = opLogo;
          if (opName) name = opName;
          if (opMotto) motto = opMotto;
        }

        setLocalLogo(logo);
        setLocalName(name || "MOUNT ANNAPURNA SECONDARY SCHOOL");
        setLocalMotto(motto || "LOVE TO LEARN - LIVE TO SERVE");
      } catch (e) {
        console.warn("Could not read branding from localStorage:", e);
      }
    };

    updateBranding();
    
    // Listen to parent storage events in case tabs update it
    window.addEventListener("storage", updateBranding);
    
    // Set up a small interval to capture changes in same-window react state
    const interval = setInterval(updateBranding, 1000);

    return () => {
      window.removeEventListener("storage", updateBranding);
      clearInterval(interval);
    };
  }, []);

  const activeSchoolName = propSchoolName || localName;
  const activeMotto = propMotto || localMotto;
  const activeCustomLogo = propLogoUrl !== undefined ? propLogoUrl : localLogo;

  const handleCandidateError = () => {
    if (candidateIndex < CANDIDATES.length - 1) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setCandidateError(true);
    }
  };

  // 1. If we have a custom uploaded Base64 logo, render it instantly and bypass template candidates
  // Since custom logos may contain the full school name and motto in a combined image,
  // we render them in full high-fidelity size with responsive limits so all text in the photo is crisp.
  if (activeCustomLogo && !customLogoError) {
    return (
      <img
        src={activeCustomLogo}
        alt={`${activeSchoolName} Logo`}
        className={className}
        style={{ 
          display: "block", 
          height: "auto", 
          minHeight: "68px", 
          maxHeight: "88px", 
          width: "auto", 
          objectFit: "contain", 
          ...style 
        }}
        onError={() => setCustomLogoError(true)}
      />
    );
  }

  // 2. Fallback to candidate file paths on disk
  if (!candidateError && !activeCustomLogo) {
    return (
      <img
        src={CANDIDATES[candidateIndex]}
        alt={`${activeSchoolName} Logo`}
        className={className}
        style={{ display: "block", maxHeight: "100%", width: "auto", objectFit: "contain", ...style }}
        onError={handleCandidateError}
      />
    );
  }

  // 3. Perfect high-fidelity responsive SVG fallback
  // Handle layout splits for the school name in the nameplate:
  const words = activeSchoolName.split(" ");
  let nameLine1 = activeSchoolName;
  let nameLine2 = "";

  if (words.length > 2) {
    const mid = Math.ceil(words.length / 2);
    nameLine1 = words.slice(0, mid).join(" ");
    nameLine2 = words.slice(mid).join(" ");
  } else if (words.length === 2) {
    nameLine1 = words[0];
    nameLine2 = words[1];
  }

  return (
    <svg
      viewBox="0 0 1040 270"
      className={className}
      style={{ display: "block", width: "100%", height: "auto", ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <path
          id="topTextArc"
          d="M 32 135 A 103 103 0 0 1 238 135"
          fill="none"
        />
        <path
          id="bottomTextArc"
          d="M 238 135 A 103 103 0 0 1 32 135"
          fill="none"
        />
      </defs>

      {/* --- LEFT HAND SEAL EMBLEM --- */}
      <g>
        {/* Navy background circle with gold border */}
        <circle
          cx="135"
          cy="135"
          r="121"
          fill="#00153f"
          stroke="#e59a18"
          strokeWidth="6.5"
        />

        {/* Outer text in white - TOP CURVE */}
        <text fill="white" fontSize="10" fontWeight="900" letterSpacing="0.05em">
          <textPath href="#topTextArc" startOffset="50%" textAnchor="middle">
            {activeSchoolName.toUpperCase().slice(0, 48)}
          </textPath>
        </text>

        {/* Outer text in white - BOTTOM CURVE */}
        <text fill="white" fontSize="10" fontWeight="900" letterSpacing="0.05em">
          <textPath href="#bottomTextArc" startOffset="50%" textAnchor="middle">
            {activeMotto.toUpperCase().slice(0, 48)}
          </textPath>
        </text>

        {/* Solid white dots separating top and bottom texts */}
        <circle cx="28" cy="135" r="4.5" fill="white" />
        <circle cx="242" cy="135" r="4.5" fill="white" />

        {/* Inner globe background (White) with gold border */}
        <circle
          cx="135"
          cy="135"
          r="88"
          fill="white"
          stroke="#e59a18"
          strokeWidth="3.5"
        />

        {/* Globe Grid Lines */}
        <line x1="135" y1="47" x2="135" y2="223" stroke="#00153f" strokeWidth="1.2" strokeOpacity="0.25" />
        <line x1="47" y1="135" x2="223" y2="135" stroke="#00153f" strokeWidth="1.2" strokeOpacity="0.25" />
        <path d="M 135 47 Q 85 135 135 223" stroke="#00153f" strokeWidth="1" strokeOpacity="0.2" fill="none" />
        <path d="M 135 47 Q 185 135 135 223" stroke="#00153f" strokeWidth="1" strokeOpacity="0.2" fill="none" />
        <path d="M 75 92 Q 135 115 195 92" stroke="#00153f" strokeWidth="1" strokeOpacity="0.2" fill="none" />
        <path d="M 75 178 Q 135 155 195 178" stroke="#00153f" strokeWidth="1" strokeOpacity="0.2" fill="none" />

        {/* Two children holding hands */}
        <circle cx="112" cy="113" r="8.5" fill="#00153f" />
        <path d="M 100 146 L 124 146 L 117 124 L 107 124 Z" fill="#00153f" />
        <path d="M 107 124 Q 96 132 101 139" stroke="#00153f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <line x1="106" y1="146" x2="106" y2="157" stroke="#00153f" strokeWidth="3" strokeLinecap="round" />
        <line x1="118" y1="146" x2="118" y2="157" stroke="#00153f" strokeWidth="3" strokeLinecap="round" />

        <line x1="117" y1="133" x2="151" y2="133" stroke="#00153f" strokeWidth="3.5" strokeLinecap="round" />

        <circle cx="156" cy="113" r="8.5" fill="#00153f" />
        <path d="M 146 124 L 166 124 L 166 142 L 146 142 Z" fill="#00153f" />
        <line x1="156" y1="134" x2="156" y2="142" stroke="white" strokeWidth="1.5" />
        <path d="M 165 124 Q 175 132 170 139" stroke="#00153f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <line x1="151" y1="142" x2="151" y2="157" stroke="#00153f" strokeWidth="3.2" strokeLinecap="round" />
        <line x1="161" y1="142" x2="161" y2="157" stroke="#00153f" strokeWidth="3.2" strokeLinecap="round" />

        {/* ESTD Banner */}
        <path
          d="M 68 174 Q 135 188 202 174 L 197 192 Q 135 206 73 192 Z"
          fill="white"
          stroke="#e59a18"
          strokeWidth="1.5"
        />
        <text x="135" y="188.5" textAnchor="middle" fill="#00153f" fontSize="12" fontWeight="950" letterSpacing="0.05em">
          ESTD.1979
        </text>
      </g>

      {/* --- RIGHT HAND NAMEPLATE TEXT --- */}
      <g>
        <text
          x="270"
          y={nameLine2 ? "100" : "145"}
          fill="#00153f"
          fontSize={nameLine2 ? "55" : "66"}
          fontWeight="900"
          textLength={nameLine2 ? undefined : "705"}
          lengthAdjust={nameLine2 ? undefined : "spacingAndGlyphs"}
          style={{ fontFamily: "'Inter', 'Impact', 'Arial Black', sans-serif" }}
        >
          {nameLine1}
        </text>
        {nameLine2 && (
          <text
            x="270"
            y="160"
            fill="#00153f"
            fontSize="45"
            fontWeight="800"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {nameLine2}
          </text>
        )}

        {/* Styled Motto Horizontal Lines */}
        <line x1="270" y1="214" x2="415" y2="214" stroke="#e59a18" strokeWidth="3.5" />
        <text
          x="622"
          y="221"
          textAnchor="middle"
          fill="#00153f"
          fontSize="18.5"
          fontWeight="850"
          letterSpacing="0.06em"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {activeMotto.toUpperCase()}
        </text>
        <line x1="830" y1="214" x2="975" y2="214" stroke="#e59a18" strokeWidth="3.5" />
      </g>
    </svg>
  );
};
