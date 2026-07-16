import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getStudentPronouns(name: string) {
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
    const endsWithA = firstWord.endsWith("a") && !firstWord.endsWith("indra") && !firstWord.endsWith("endra") && !firstWord.endsWith("shra");
    const endsWithI = firstWord.endsWith("i") || firstWord.endsWith("y");
    if (endsWithA || endsWithI || firstWord.endsWith("ee") || firstWord.endsWith("sha") || firstWord.endsWith("ya") || normalized.includes("kumari") || normalized.includes("devi")) {
      isFemale = true;
    } else {
      isFemale = false;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial parse middleware
  app.use(express.json());

  // API Check Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-Side Gemini API Proxy: Generate bespoke Teacher's report card comments
  app.post("/api/generate-comments", async (req, res) => {
    try {
      const { name, grade, scores } = req.body;
      
      const hasValidKey = process.env.GEMINI_API_KEY && 
                          process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && 
                          process.env.GEMINI_API_KEY.trim().length > 0;

      if (!hasValidKey) {
        // High-quality contextual fallback comments for instant usability even without configured keys
        const total = (scores.participation || 0) + (scores.homework || 0) + (scores.mcq || 0) + (scores.project || 0) + (scores.lab || 0);
        const pron = getStudentPronouns(name || "");
        let strengthText = "";
        let improvementText = "";

        if (total >= 85) {
          strengthText = `${name || "The student"} demonstrates wonderful progress in all parts of computer class. ${pron.subject} stays very focused during lessons and shows excellent creativity in practical activities.`;
          improvementText = `To continue growing, ${pron.subjectLower} is encouraged to explore advanced computer activities or help friends who are still learning. Keep up the brilliant effort!`;
        } else if (total >= 70) {
          strengthText = `${name || "The student"} consistently completes ${pron.possessiveAdj} computer lab exercises on time and has a solid understanding of theoretical topics. ${pron.subject} participates nicely in class.`;
          improvementText = `Spending a tiny bit more time double-checking ${pron.possessiveAdj} work before submitting will help ${pron.object} reach even higher grades. ${pron.subject} should feel proud of ${pron.possessiveAdj} effort!`;
        } else if (total >= 50) {
          strengthText = `${name || "The student"} demonstrates a satisfactory understanding of basic computer ideas and coordinates well during practical computer lab time.`;
          improvementText = `Recommended to practice comfortable keyboard typing drills at home and focus more when instructions are given. We are excited to see ${pron.object} grow!`;
        } else {
          strengthText = `${name || "The student"} comes to the computer room with a happy, friendly smile. ${pron.subject} follows class rules well and always tries ${pron.possessiveAdj} best when given guided steps.`;
          improvementText = `${pron.subject} will benefit from practicing simple typing drills at home and paying closer attention when the teacher explains tasks. With steady practice, ${pron.subjectLower} will surely improve!`;
        }

        return res.json({
          strengths: strengthText,
          areasOfImprovement: improvementText
        });
      }

      // Initialize Google GenAI
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const scoresText = Object.entries(scores || {})
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");

      const pron = getStudentPronouns(name || "");
      const genderText = pron.subject === "He" ? "Male (Use 'he', 'him', 'his' pronouns)" : "Female (Use 'she', 'her', 'hers' pronouns)";

      const prompt = `Student Name: ${name || "Sudeep"}
Pronouns to Use: ${genderText}
Grade Level: ${grade || "3"}
Scores: ${scoresText} (Class Participation and Attentiveness out of 10, Homework and Independent Practice out of 10, Computer Concepts and Assessment out of 30, Creative Work and Projects out of 30, Practical Lab Performance out of 20).

Task: Generate an encouraging and professional Computer Studies report card remark for a Grade 3 student.
Instructions:
- Use professional, warm, and parent-friendly language.
- Keep the English clear and natural—neither too simple nor too advanced.
- CRITICAL: You MUST use the correct gender-specific pronouns (${genderText}). Do NOT use they/them/their.
- Do not list numerical scores or grades anywhere. Instead, explain the overall performance.
- Mention the student's strengths based on their highest-performing score areas.
- Mention one or two areas for improvement based on their lower-performing score areas.
- Maintain a positive, supportive, and encouraging tone throughout.
- Avoid repetitive phrases and overly formal educational jargon.
- Provide a constructive suggestion or encouraging statement at the end of each field.

Provide your output as parsed JSON with exactly these two keys:
1. "strengths": 1-2 positive, specific sentences starting with the student's name, highlighting their computer studies capabilities and overall positive highlights based on their top scores.
2. "areasOfImprovement": 1-2 constructive, helpful sentences focusing on concrete things they can practice or improve on, ending with a warm and positive encouragement statement.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an experienced Grade 3 Computer Studies teacher writing warm, parents-friendly, and constructive student feedback reports. Your comments are natural, clear, and highly personalized based on the student's actual performance patterns.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.STRING,
                description: "Warm, parent-friendly sentences highlighting the student's performance and computing strengths.",
              },
              areasOfImprovement: {
                type: Type.STRING,
                description: "Encouraging, constructive suggestions for one or two areas of growth based on lower scores.",
              }
            },
            required: ["strengths", "areasOfImprovement"]
          }
        }
      });

      const textOutput = response.text ? response.text.trim() : "{}";
      const parsed = JSON.parse(textOutput);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini API Error in Server proxy:", error);
      res.status(500).json({
        strengths: "Demonstrates consistent class attendance and engages hands-on during digital lessons.",
        areasOfImprovement: "Continuing basic revision of programming variables and completing lab worksheets will solidify computing concepts."
      });
    }
  });

  // Vite development integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Serve index.html transformed with Vite for any non-API route in dev
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      if (req.method !== "GET") {
        return next();
      }
      
      const ext = path.extname(req.path);
      if (ext && ext !== ".html") {
        return next();
      }

      const url = req.originalUrl;
      try {
        const templatePath = path.resolve(process.cwd(), "index.html");
        let template = await fs.promises.readFile(templatePath, "utf-8");
        // Transform template through Vite's HTML transform plugin chain
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log("Vite development server middleware & fallbacks loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html as fallback for any frontend routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured at dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduGrade Hub Server boot completed. Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server boot failure:", err);
});
