import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Route for Question Generation
app.post("/api/generate-anket", async (req, res) => {
  try {
    const prompt = `
      Create a statistics question for 5th grade students (MAT.5.5.1 and MAT.5.5.2). 
      The goal is to analyze categorical data and interpret claims.
      Return a JSON object with data categories, a statement/claim, whether it's true, and an explanation.
      Language: Turkish (Türkçe).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  count: { type: Type.NUMBER }
                },
                required: ["category", "count"]
              }
            },
            statement: { type: Type.STRING },
            isTrue: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING }
          },
          required: ["data", "statement", "isTrue", "explanation"]
        }
      }
    });

    const question = JSON.parse(response.text || "{}");
    res.json(question);
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
