import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
        let strengthText = "";
        let improvementText = "";

        if (total >= 85) {
          strengthText = `${name || "The student"} demonstrates outstanding computational logical reasoning, a stellar work ethic in programming exercises, and active participation in class discussions.`;
          improvementText = `To extend skills further, continuing to explore independent coding projects and assisting peers with logic problems is encouraged.`;
        } else if (total >= 70) {
          strengthText = `${name || "The student"} consistently completes computer lab exercises on time, has a good grasp of core theory elements, and practices good posture/safety standards.`;
          improvementText = `Should work on double-checking theoretical MCQ worksheets to convert very good performance into absolute excellence.`;
        } else if (total >= 50) {
          strengthText = `${name || "The student"} displays a satisfactory foundation in computational terminology and can follow structured step-by-step instructions in the computer lab.`;
          improvementText = `Would benefit from extra typing drill practices and reviewing homework materials to build up keyboard speed and independent confidence.`;
        } else {
          strengthText = `${name || "The student"} is friendly and shows great potential when given 1-on-1 guided instructions on basic computer interactions.`;
          improvementText = `Requires regular practice with lab software structures, and dedicated typing support is recommended to catch up with class assignments.`;
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

      const prompt = `Student Name: ${name || "Sudeep"}
Grade Level: ${grade || "4"}
Scores Log: ${scoresText} (Participation out of 10, Homework out of 10, MCQ out of 30, Project out of 30, Lab out of 20).

Task: Generate realistic, highly customized, and professional Computer Science report card remarks for parent view.
Do not list numerical scores in your narrative. Use encouraging but strictly objective, pedagogical, and helpful terminology (e.g., computational thinking, typing mastery, active lab collaboration, concept retention, program debugging).

Provide your output as a parsed JSON containing two fields:
1. "strengths": 1-2 positive, specific sentences starting with the student's name highlighting their computer science capability.
2. "areasOfImprovement": 1-2 objective, constructive sentences highlighting concrete keyboard, computational practice, or focus habits they can train on.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an experienced, elite K-12 Computer Science teacher writing child-focused, supportive, objective assessment narratives to parents.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: {
                type: Type.STRING,
                description: "Positive observations about coding, theoretical concepts, or computer laboratory skills.",
              },
              areasOfImprovement: {
                type: Type.STRING,
                description: "Constructive steps for logical improvements, study habits, keyboard drills, or homework submission.",
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
    console.log("Vite development server middleware loaded.");
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
