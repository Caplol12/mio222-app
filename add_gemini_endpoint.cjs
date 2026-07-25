const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const importStatement = `import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";`;

code = code.replace(`import dotenv from "dotenv";`, importStatement);

const endpointCode = `
  // Gemini Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A valid message string is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: "Failed to generate AI response." });
    }
  });

  // Apply Vite dev server`;

code = code.replace(`  // Apply Vite dev server`, endpointCode);

fs.writeFileSync('server.ts', code);
