
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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
            "Structure your responses using clean markdown headings, bulleted lists, inline LaTeX approximation formula, and bold key concepts where appropriate, maintaining a highly professional, clinical, and helpful researcher tone.",
          tools: [{ googleSearch: {} }]
        }
      });
      
      res.json({ success: true, text: response.text });
    } catch (error: any) {
      console.error("Gemini Advisor Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/gemini/synthesis", async (req, res) => {
    const { phaseName, formula, morphology, size, temp, time, doping, pH, atmosphere, focus, customKey } = req.body;
    try {
      const keyToUse = customKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        res.status(400).json({ success: false, error: "Please configure your Gemini API Key in the application Settings tab." });
        return;
      }
      
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-synthesis',
          }
        }
      });

      const prompt = `Formulate a publication-grade synthetic recipe and morphological growth analysis for preparing Nanocrystalline **${phaseName}** (Formula: **${formula}**) having **${morphology}** morphology.

Synthesis Parameters & Reaction Boundary Conditions:
- Target Crystallite Size: ${size} nm
- Calcination/Solution Temperature: ${temp} °C
- Reaction Duration: ${time} hours
- Solution pH: ${pH}
- Reaction Atmosphere: ${atmosphere}
- Lattice Dopant Level: ${doping} mol%
- Neural Tuning Core Focus: ${focus}

Provide the response in structured markdown with the following specific sections:
1.  **Stoichiometric Precursor Formulation**: Specify actual chemical precursors (e.g. nitrates, acetates, halides etc.) and calculate precise millimolar ratios for preparing 1.0g of the material with ${doping} mol% doping.
2.  **Solvent, Surfactant & Capping Agent Selection**: Recommend suitable solvents (e.g. DMF, ethanol, ethylene glycol, benzyl ether) and capping ligands (e.g. oleic acid, CTAB, TOPO, PEG) to restrict the crystal growth to the target morphology (${morphology}) and crystallite size (${size} nm).
3.  **Hydrothermal/Calcination Temperature Ramp & Profile**: Describe a temperature profile from room temp to ${temp} °C with ramping speed (e.g., 5°C/min), holding time (${time} hours), and cooling rate under ${atmosphere} environment.
4.  **Lattice Strain & Thermodynamics Analysis**: Analyze how the ${doping} mol% dopant level affects the lattice strain (Williamson-Hall profile) and structural coherence in the ${morphology} structure.
5.  **Quality Control & Secondary Phase Impurity Guidelines**: Provide practical laboratory hints for verifying synthesis completion using X-ray Diffraction (XRD peak movements) and avoiding common impurities.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are XRD-Calc Pro's Senior AI Materials Synthesis Expert. " +
            "Your task is to provide an elite, publication-grade, and academically thorough synthesis recipe/formulation advise for preparing the requested nanomaterial phase with specific morphology under current autoclave/reaction conditions. " +
            "Structure your response with clean headings, readable bullet points, equations where needed, and a professional, academic tone.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      
      res.json({ success: true, text: response.text });
    } catch (error: any) {
      console.error("Gemini Synthesis Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/gemini/coder", async (req, res) => {
    const { prompt, context, customKey } = req.body;
    try {
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ success: false, error: "A valid coding prompt is required." });
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
            'User-Agent': 'aistudio-build-coder',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are the advanced XRD-Calc Pro Automated Python Scripting Engine. " +
            "Your task is to generate complete, production-ready, functional, and standalone Python 3 scripts for X-ray diffraction (XRD) data analysis. " +
            "Your coding style is exemplary. Follow clean architecture principles:\n" +
            "1. Always include clear docstrings, typing hints, PEP 8 compliance, and thorough inline explanations of crystallographic math.\n" +
            "2. Implement core mathematical models directly: Bragg's law (d = lambda / (2 * sin(theta))), Scherrer equations (D = K*lambda / (B*cos(theta))), lattice strain derivations, or composite profile modeling.\n" +
            "3. Ensure the script includes a 'Self-Generating Mock XRD data fallback' at the very beginning of its execution block. If the local data file (e.g. data.xy or data.csv) is not found, the script must dynamically generate a high-fidelity synthetic XRD pattern with peak noise, baseline curvature, and realistic peak broadening, save it to disk, and continue analysis seamlessly. This ensures the output script acts as an out-of-the-box working sandbox.\n" +
            "4. Use high-performance scientific libraries like NumPy, SciPy (optimize, signal, interpolate), Matplotlib (publication-grade style), Pandas, or GSAS-II/xrayutilities if requested.\n" +
            "5. Output ONLY valid, executable Python code. Never include introductory text, explanations outside comments, or conversational sentences.\n" +
            "Context to integrate:\n" + JSON.stringify(context || {}),
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      
      let codeText = response.text || "";
      // Strip markdown code block boundaries if they are present
      if (codeText.includes("```python")) {
        const parts = codeText.split("```python");
        if (parts.length > 1) {
          codeText = parts[1].split("```")[0];
        }
      } else if (codeText.includes("```")) {
        const parts = codeText.split("```");
        if (parts.length > 1) {
          codeText = parts[1].split("```")[0];
        }
      }
      codeText = codeText.trim();
      
      res.json({ success: true, text: codeText });
    } catch (error: any) {
      console.error("Gemini Coder Endpoint Error:", error);
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
