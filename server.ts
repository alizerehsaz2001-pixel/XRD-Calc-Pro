
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "users.json");

let aiInstance: any = null;
function getGeminiClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined inside current environment secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/register", (req, res) => {
    const userData = req.body;
    
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      users = JSON.parse(data);
    }
    
    users.push({
      ...userData,
      registeredAt: new Date().toISOString()
    });
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: "User registered successfully" });
  });

  app.get("/api/users", (req, res) => {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  });

  app.post("/api/gemini/advisor", async (req, res) => {
    const { prompt, customKey } = req.body;
    try {
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ success: false, error: "A valid prompt string is required." });
        return;
      }
      
      const keyToUse = customKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        res.status(400).json({ success: false, error: "Please configure your Gemini API Key in the application Settings tab." });
        return;
      }
      
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are XRD-Calc Pro's Senior AI Crystallography Expert and Physics Advisor. " +
            "Your mission is to provide high-fidelity, academically precise, and actionable solutions for X-ray diffraction, Bragg d-spacing, Scherrer crystallite sizing, Williamson-Hall strain deconvolution, Rietveld structure refinement, preferred orientation texture corrections, and polymer search-match validations. " +
            "Structure your responses using clean markdown headings, bulleted lists, inline LaTeX approximation formula, and bold key concepts where appropriate, maintaining a highly professional, clinical, and helpful researcher tone."
        }
      });
      
      res.json({ success: true, text: response.text });
    } catch (error: any) {
      console.error("Gemini Advisor Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/gemini/verify", async (req, res) => {
    const { customKey } = req.body;
    const keyToUse = customKey || process.env.GEMINI_API_KEY;
    
    if (!keyToUse) {
      res.json({ success: false, error: "No API Key available in current session.", status: "MISSING" });
      return;
    }
    
    try {
      const client = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-verifier',
          }
        }
      });
      
      // Try a very quick low-cost single token response to thoroughly test authentication rights
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "State only 'ONLINE' to confirm connection.",
        config: {
          maxOutputTokens: 5
        }
      });
      
      res.json({ 
        success: true, 
        status: "ACTIVE",
        isCustom: !!customKey, 
        message: "API Key successfully validated with full operational privileges.",
        reply: response.text
      });
    } catch (err: any) {
      console.error("API Key Verification Error:", err);
      res.json({ 
        success: false, 
        status: "INVALID",
        error: err.message || "Invalid credentials or network timeout." 
      });
    }
  });

  // Simple route to check if environment variables are configured
  app.get("/api/gemini/config", (req, res) => {
    res.json({
      hasEnvKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
