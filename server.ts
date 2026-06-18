
import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { exec, execSync } from "child_process";
import https from "https";

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

let pythonDepsReady = false;
let pythonInstallLog: string[] = ["Initializing python environment checking..."];

function logToPythonStatus(message: string) {
  console.log(message);
  pythonInstallLog.push(message);
  try {
    fs.appendFileSync(path.join(process.cwd(), "python_install_status.log"), message + "\n");
  } catch (err) {
    // Ignore log write errors
  }
}

function execCommandAsync(cmd: string): Promise<{ success: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 180000 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout: stdout || "",
        stderr: stderr || ""
      });
    });
  });
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(true));
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {}); // delete the file on error
      resolve(false);
    });
  });
}

async function ensurePythonDependencies() {
  const logPath = path.join(process.cwd(), "python_install_status.log");
  try {
    fs.writeFileSync(logPath, "=== Python Environment Verification started at " + new Date().toISOString() + " ===\n");
  } catch (err) {}

  logToPythonStatus("Checking Python dependencies...");
  const depsCheck = [
    { module: "numpy", pkg: "numpy" },
    { module: "pandas", pkg: "pandas" },
    { module: "scipy", pkg: "scipy" },
    { module: "PIL", pkg: "Pillow" },
    { module: "cv2", pkg: "opencv-python-headless" },
    { module: "matplotlib", pkg: "matplotlib" },
    { checkCmd: "from google import genai", pkg: "google-genai" }
  ];

  // Check if pip is available
  let pipAvailable = false;
  try {
    execSync("python3 -m pip --version", { stdio: "ignore" });
    pipAvailable = true;
    logToPythonStatus("Pip is already available.");
  } catch (e) {
    logToPythonStatus("Pip is NOT available. Attempting pip bootstrap...");
  }

  if (!pipAvailable) {
    // Attempt 1: ensurepip
    logToPythonStatus("Attempting python3 -m ensurepip...");
    const epResult = await execCommandAsync("python3 -m ensurepip --default-pip");
    logToPythonStatus(`ensurepip status: ${epResult.success}`);
    if (epResult.success) {
      try {
        execSync("python3 -m pip --version", { stdio: "ignore" });
        pipAvailable = true;
      } catch (err) {}
    }

    if (!pipAvailable) {
      // Attempt 2: download get-pip.py and run it
      logToPythonStatus("Downloading get-pip.py via https...");
      const dest = path.join(process.cwd(), "get-pip.py");
      const downloaded = await downloadFile("https://bootstrap.pypa.io/get-pip.py", dest);
      logToPythonStatus(`get-pip.py downloaded: ${downloaded}`);
      if (downloaded) {
        logToPythonStatus("Running get-pip.py with --break-system-packages...");
        const runPip = await execCommandAsync(`python3 "${dest}" --break-system-packages`);
        logToPythonStatus(`get-pip.py run status: ${runPip.success}`);
        if (runPip.stdout) logToPythonStatus(`get-pip.py stdout: ${runPip.stdout}`);
        if (runPip.stderr) logToPythonStatus(`get-pip.py stderr: ${runPip.stderr}`);

        if (!runPip.success) {
          logToPythonStatus("Running get-pip.py with --user --break-system-packages...");
          const runPipUser = await execCommandAsync(`python3 "${dest}" --user --break-system-packages`);
          logToPythonStatus(`get-pip.py user run status: ${runPipUser.success}`);
          if (runPipUser.stdout) logToPythonStatus(`get-pip.py user stdout: ${runPipUser.stdout}`);
          if (runPipUser.stderr) logToPythonStatus(`get-pip.py user stderr: ${runPipUser.stderr}`);
        }
        
        try {
          execSync("python3 -m pip --version", { stdio: "ignore" });
          pipAvailable = true;
          logToPythonStatus("Pip was successfully bootstrapped!");
        } catch (err) {
          logToPythonStatus("Pip is still unavailable after running get-pip.py.");
        }
      }
    }
  }

  const toInstall: string[] = [];
  for (const dep of depsCheck) {
    try {
      const checkStr = dep.checkCmd ? dep.checkCmd : `import ${dep.module}`;
      execSync(`python3 -c "${checkStr}"`, { stdio: "ignore" });
      logToPythonStatus(`Python dependency '${dep.pkg}' is satisfied.`);
    } catch (e) {
      logToPythonStatus(`Python dependency '${dep.pkg}' is missing.`);
      toInstall.push(dep.pkg);
    }
  }

  if (toInstall.length > 0) {
    logToPythonStatus(`Packages to install: ${toInstall.join(", ")}`);
    
    for (const pkg of toInstall) {
      logToPythonStatus(`--- Processing package: ${pkg} ---`);
      
      const commands = [
        `python3 -m pip install --break-system-packages --root-user-action=ignore ${pkg}`,
        `python3 -m pip install --user --break-system-packages --root-user-action=ignore ${pkg}`,
        `pip3 install --break-system-packages --root-user-action=ignore ${pkg}`,
        `pip3 install --user --root-user-action=ignore ${pkg}`
      ];
      
      let installed = false;
      for (const cmd of commands) {
        logToPythonStatus(`Executing: ${cmd}`);
        const result = await execCommandAsync(cmd);
        logToPythonStatus(`Result success: ${result.success}`);
        if (result.stdout) logToPythonStatus(`Stdout: ${result.stdout}`);
        if (result.stderr) logToPythonStatus(`Stderr: ${result.stderr}`);
        
        if (result.success) {
          logToPythonStatus(`Success installing ${pkg} with command: ${cmd}`);
          installed = true;
          break;
        }
      }
      
      if (!installed) {
        logToPythonStatus(`WARNING: Failed to install package ${pkg} after all attempts.`);
      }
    }
  }

  // Final verification check
  logToPythonStatus("Final verification check...");
  let vitalReady = true;
  for (const dep of depsCheck) {
    try {
      const checkStr = dep.checkCmd ? dep.checkCmd : `import ${dep.module}`;
      execSync(`python3 -c "${checkStr}"`, { stdio: "ignore" });
      logToPythonStatus(`Final Verification: '${dep.pkg}' is SUCCESS.`);
    } catch (e) {
      logToPythonStatus(`Final Verification: '${dep.pkg}' is STILL MISSING.`);
      if (dep.pkg === "numpy" || dep.pkg === "google-genai") {
        vitalReady = false;
      }
    }
  }

  if (vitalReady) {
    pythonDepsReady = true;
    logToPythonStatus("Python environment configuration complete (vital packages verified).");
  } else {
    logToPythonStatus("Python environment config completed with errors. Vital libraries are missing.");
  }
}

async function startServer() {
  // Check and install missing Python packages in background during boot
  ensurePythonDependencies().catch(err => {
    console.error("Background python dependency validation error:", err);
  });

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

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

  app.get("/api/python/status", (req, res) => {
    res.json({
      ready: pythonDepsReady,
      logs: pythonInstallLog
    });
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

  app.post("/api/gemini/global-sync", async (req, res) => {
    const { query, databaseId, customKey } = req.body;
    try {
      if (!query || typeof query !== 'string') {
        res.status(400).json({ success: false, error: "A valid search query is required." });
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
            'User-Agent': 'aistudio-build-global-sync',
          }
        }
      });

      const prompt = `Find and compile high-fidelity, peer-reviewed crystallography and material science properties for phases or minerals matching the query: "${query}" from the scientific database registry: "${databaseId}".
      You MUST provide authentic material specifications. Compile up to 4 prominent and distinct structural matches.
      For each material, compile:
      - Correct chemical name (e.g., Titanium Dioxide Rutile)
      - Precise formula (e.g., TiO2)
      - Crystal system (e.g., Tetragonal, Cubic, Hexagonal, etc.)
      - Valid Space group (e.g., P42/mnm)
      - Theoretical calculated density in g/cm³
      - Molecular weight in g/mol
      - Elastic shear or Young's modulus (stiffness) in GPa
      - A comprehensive structural property description suitable for researchers
      - An XRD diffraction spectrum pattern string with peak definitions in direct twoTheta intensity format, e.g. "25.3 100\\n36.1 45\\n41.2 20\\n54.3 60"
      - List of present chemical elements
      - List of practical industrial/scientific applications.
      
      Respond only with the JSON array schema details requested. Ground your response using Google search on academic databases if required. Ensure the output is highly accurate.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                formula: { type: "STRING" },
                crystalSystem: { type: "STRING" },
                spaceGroup: { type: "STRING" },
                density: { type: "NUMBER" },
                molecularWeight: { type: "NUMBER" },
                elasticModulus: { type: "NUMBER" },
                type: { type: "STRING" },
                pattern: { type: "STRING", description: "XRD peaks in standard twoTheta relative-intensity format, e.g. '25.3 100\\n36.1 45\\n41.2 20\\n54.4 60'" },
                elements: { type: "ARRAY", items: { type: "STRING" } },
                description: { type: "STRING" },
                applications: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["name", "formula", "crystalSystem", "spaceGroup", "density", "pattern", "elements"]
            }
          }
        }
      });

      let text = response.text || "[]";
      // Clean up markdown block wrapping if returned
      text = text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
      
      let results: any[] = [];
      try {
        results = JSON.parse(text);
      } catch (prsErr) {
        console.error("JSON parsing failed, retrying manual clean", prsErr, text);
        // Fallback simple extract if some wrapping survived
        const firstArr = text.indexOf('[');
        const lastArr = text.lastIndexOf(']');
        if (firstArr !== -1 && lastArr !== -1) {
          results = JSON.parse(text.substring(firstArr, lastArr + 1));
        } else {
          throw prsErr;
        }
      }

      res.json({ success: true, materials: results });
    } catch (error: any) {
      console.error("Gemini Global Sync Endpoint Error:", error);
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

  // Machine Learning Python Neural Network Training Endpoint
  app.post("/api/gemini/train-neural-net", async (req, res) => {
    const { 
      epochs, 
      learningRate, 
      batchSize, 
      optimizer, 
      architecture, 
      noiseLevel, 
      backgroundDrift, 
      strainRange, 
      broadeningRange,
      dropout,
      activation
    } = req.body;
    
    try {
      const scriptPath = path.join(__dirname, "utils", "trainNeuralNet.py");
      
      const epochsVal = Number(epochs) || 40;
      const lrVal = Number(learningRate) || 0.005;
      const bsVal = Number(batchSize) || 32;
      const optVal = String(optimizer) || "Adam";
      const archVal = String(architecture) || "Deep MLP";
      const noiseVal = (Number(noiseLevel) || 10) / 100.0;
      const bgVal = Number(backgroundDrift) || 5.0;
      const strainVal = (Number(strainRange) || 2) / 100.0;
      const broadVal = Number(broadeningRange) || 0.25;
      const dropVal = Number(dropout) || 0.0;
      const actVal = String(activation) || "GELU";

      const cmd = `python3 "${scriptPath}" --epochs=${epochsVal} --lr=${lrVal} --batch_size=${bsVal} --optimizer="${optVal}" --architecture="${archVal}" --noise_level=${noiseVal} --background_drift=${bgVal} --strain_range=${strainVal} --broadening_range=${broadVal} --dropout=${dropVal} --activation="${actVal}"`;

      const { exec } = await import("child_process");
      
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("Python Training Execution Error:", error, stderr);
          res.status(500).json({ success: false, error: "Error executing Python Neural Net Training: " + stderr });
          return;
        }

        try {
          const results = JSON.parse(stdout.trim());
          res.json(results);
        } catch (parseError) {
          console.error("Failed to parse Python Training output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python Training output: " + stdout });
        }
      });
      
    } catch (error: any) {
      console.error("Neural Net Training Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Machine Learning Python RAG Analysis Endpoint
  app.post("/api/gemini/rag-analysis", async (req, res) => {
    const { experimental_peaks, customKey } = req.body;
    try {
      if (!experimental_peaks || !Array.isArray(experimental_peaks)) {
        res.status(400).json({ success: false, error: "A valid array of experimental peaks is required." });
        return;
      }

      // Normalize key names from twoTheta -> two_theta for Python execution
      const normalizedPeaks = experimental_peaks.map((p: any) => ({
        two_theta: Number(p.twoTheta !== undefined ? p.twoTheta : p.two_theta),
        intensity: Number(p.intensity)
      })).filter(p => !isNaN(p.two_theta) && !isNaN(p.intensity));

      const apiKeyToUse = customKey || process.env.GEMINI_API_KEY || "";
      const payloadString = JSON.stringify({
        experimental_peaks: normalizedPeaks,
        api_key: apiKeyToUse
      });

      const scriptPath = path.join(__dirname, "utils", "phaseIdValidator.py");
      
      // Escape the payload JSON string for shell consumption safely
      const escapedPayload = JSON.stringify(payloadString);

      // Dynamically run python pipeline
      const { exec } = await import("child_process");
      
      exec(`python3 "${scriptPath}" --json=${escapedPayload}`, (error, stdout, stderr) => {
        if (error) {
          console.error("Python RAG Execution Error:", error, stderr);
          res.status(500).json({ success: false, error: "Error executing Python RAG engine: " + stderr });
          return;
        }

        try {
          const results = JSON.parse(stdout);
          res.json({ success: true, ...results });
        } catch (parseError) {
          console.error("Failed to parse Python RAG output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python RAG output" });
        }
      });

    } catch (error: any) {
      console.error("Gemini RAG Analysis Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Machine Learning Python + Pandas Rietveld Solver Endpoint
  app.post("/api/rietveld/refine", async (req, res) => {
    const payload = req.body;
    try {
      const scriptPath = path.join(__dirname, "utils", "rietveldRefinement.py");
      
      // Escape the payload JSON string safely
      const escapedPayload = JSON.stringify(JSON.stringify(payload));

      const { exec } = await import("child_process");
      
      exec(`python3 "${scriptPath}" --json=${escapedPayload}`, (error, stdout, stderr) => {
        if (error) {
          console.error("Python Rietveld Solver Execution Error:", error, stderr);
          res.status(500).json({ success: false, error: "Error executing Python Rietveld Solver: " + stderr });
          return;
        }

        try {
          const results = JSON.parse(stdout);
          res.json({ success: true, ...results });
        } catch (parseError) {
          console.error("Failed to parse Python Rietveld output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python Rietveld output: " + stdout });
        }
      });

    } catch (error: any) {
      console.error("Rietveld Refinement Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Python + Matplotlib Scientific Illustrator Script Execution Endpoint
  app.post("/api/image/matplotlib", async (req, res) => {
    const { code } = req.body;
    try {
      if (!code || typeof code !== "string") {
        res.status(400).json({ success: false, error: "Python matplotlib script is required." });
        return;
      }

      const scriptPath = path.join(__dirname, "utils", "matplotlibGenerator.py");
      const { spawn } = await import("child_process");
      
      const child = spawn("python3", [scriptPath]);
      
      let stdout = "";
      let stderr = "";
      
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      child.on("close", (code) => {
        if (code !== 0) {
          console.error("Python Matplotlib Generator Error:", stderr);
          res.status(500).json({ success: false, error: "Error executing Python Matplotlib script: " + (stderr || "exit code " + code) });
          return;
        }

        try {
          const results = JSON.parse(stdout.trim());
          res.json(results);
        } catch (parseError) {
          console.error("Failed to parse Python Matplotlib output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python Matplotlib output." });
        }
      });
      
      // Feed python code payload to standard input
      child.stdin.write(JSON.stringify({ code }));
      child.stdin.end();

    } catch (error: any) {
      console.error("Matplotlib Generator Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Machine Learning Python + OpenCV Image Solver Endpoint
  app.post("/api/image/analyze-cv", async (req, res) => {
    const { image, params } = req.body;
    try {
      if (!image) {
        res.status(400).json({ success: false, error: "A valid base64 image is required." });
        return;
      }

      const scriptPath = path.join(__dirname, "utils", "imageAnalysis.py");
      const { spawn } = await import("child_process");
      
      const child = spawn("python3", [scriptPath]);
      
      let stdout = "";
      let stderr = "";
      
      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      child.on("close", (code) => {
        if (code !== 0) {
          console.error("Python CV Analyzer Error:", stderr);
          res.status(500).json({ success: false, error: "Error executing Python CV: " + (stderr || "exit code " + code) });
          return;
        }

        try {
          const results = JSON.parse(stdout.trim());
          res.json(results);
        } catch (parseError) {
          console.error("Failed to parse Python CV output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python CV output." });
        }
      });
      
      // Feed base64 string to python over standard input (avoids CLI ARG_MAX shell errors)
      child.stdin.write(JSON.stringify({ image, params: params || {} }));
      child.stdin.end();

    } catch (error: any) {
      console.error("Image Analysis CV Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Machine Learning Python RAG Database Search Endpoint
  app.post("/api/gemini/rag-database", async (req, res) => {
    const { query, customKey } = req.body;
    try {
      if (!query || typeof query !== "string") {
        res.status(400).json({ success: false, error: "A valid search query is required." });
        return;
      }

      const apiKeyToUse = customKey || process.env.GEMINI_API_KEY || "";
      if (!apiKeyToUse) {
        res.status(400).json({ success: false, error: "Gemini API key is missing." });
        return;
      }

      const scriptPath = path.join(__dirname, "utils", "dbRagAgent.py");
      
      const { exec } = await import("child_process");
      
      exec(`python3 "${scriptPath}" --query=${JSON.stringify(query)} --api_key="${apiKeyToUse}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Python DB RAG Execution Error:", error, stderr);
          res.status(500).json({ success: false, error: "Error executing Python DB RAG: " + stderr });
          return;
        }

        try {
          // Output may contain debug logs, find the first '{' for json, but better to just parse
          const results = JSON.parse(stdout.trim());
          res.json(results);
        } catch (parseError) {
          console.error("Failed to parse Python DB RAG output:", stdout, parseError);
          res.status(500).json({ success: false, error: "Failed to parse Python DB RAG output" });
        }
      });

    } catch (error: any) {
      console.error("Gemini RAG Database Endpoint Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
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
