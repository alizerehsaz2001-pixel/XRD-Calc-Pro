
import { GoogleGenAI, Type, Chat, GroundingChunk, ThinkingLevel } from "@google/genai";
import { AIResponse, GroundingSource, StandardWavelength } from '../types';
import { MATERIAL_DB } from "../utils/materialDB";

// Dynamic client getter supporting user custom key overrides
const getGeminiClient = (): GoogleGenAI => {
  const customKey = typeof window !== 'undefined'
    ? (localStorage.getItem('xrd_custom_gemini_key') || localStorage.getItem('gemini_custom_api_key') || process.env.GEMINI_API_KEY)
    : process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: (customKey || process.env.GEMINI_API_KEY) as string });
};

const extractSources = (metadata: any): GroundingSource[] => {
  if (!metadata?.groundingChunks) return [];
  const seen = new Set<string>();
  return metadata.groundingChunks
    .map((chunk: GroundingChunk) => {
      if (chunk.web && !seen.has(chunk.web.uri)) {
        seen.add(chunk.web.uri);
        return { title: chunk.web.title, uri: chunk.web.uri };
      }
      return null;
    })
    .filter((s: any): s is GroundingSource => s !== null);
};

export const isQuotaError = (error: any): boolean => {
  const errorStr = typeof error === 'string' ? error : JSON.stringify(error).toLowerCase();
  return (
    error?.message?.toLowerCase().includes('429') || 
    error?.status === 429 || 
    error?.code === 429 ||
    error?.error?.code === 429 ||
    error?.error?.status === 'RESOURCE_EXHAUSTED' ||
    errorStr.includes('429') ||
    errorStr.includes('resource_exhausted') ||
    errorStr.includes('quota') ||
    errorStr.includes('limit')
  );
};

export const isPermissionError = (error: any): boolean => {
  const errorStr = typeof error === 'string' ? error : JSON.stringify(error).toLowerCase();
  return (
    error?.message?.toLowerCase().includes('403') || 
    error?.status === 403 || 
    error?.code === 403 ||
    error?.error?.code === 403 ||
    error?.error?.status === 'PERMISSION_DENIED' ||
    errorStr.includes('403') ||
    errorStr.includes('permission_denied') ||
    errorStr.includes('permission') ||
    errorStr.includes('authenticated')
  );
};

export const generateScientificImage = async (
  prompt: string, 
  size: '1K' | '2K' | '4K', 
  styleLabel?: string,
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' = '1:1'
): Promise<string | null> => {
  // Create a new instance to ensure the most up-to-date API key is used (if selected via UI)
  const dynamicAi = getGeminiClient();
  const styleContext = styleLabel ? ` in the style of a ${styleLabel}` : '';
  const fullPrompt = `Generate a high-quality scientific illustration or diagram suitable for crystallography analysis${styleContext}. Prompt: ${prompt}`;

  // Method 1: Primary - Latest Nano Banana 2 (gemini-3.1-flash-image) model
  try {
    const response = await dynamicAi.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          {
            text: fullPrompt
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size
        }
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (nanoError: any) {
    if (isQuotaError(nanoError) || isPermissionError(nanoError)) {
      if (isQuotaError(nanoError)) throw new Error("Quota exceeded (429).");
      if (isPermissionError(nanoError)) throw new Error("Permission denied (403). API key might not have image generation access.");
      throw nanoError;
    }

    // Method 2: Fallback to standard Imagen 3.0 model with generateImages
    try {
      const response = await dynamicAi.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
      });

      if (response?.generatedImages?.[0]?.image?.imageBytes) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      return null;
    } catch (fallbackError: any) {
      console.error("All image generation methods failed. Main error was:", nanoError, "Fallback error was:", fallbackError);
      if (isQuotaError(fallbackError)) throw new Error("Quota exceeded (429).");
      if (isPermissionError(fallbackError)) throw new Error("Permission denied (403). API key might not have image generation access.");
      throw fallbackError;
    }
  }
  return null;
};

export const fetchStandardWavelengths = async (): Promise<StandardWavelength[]> => {
  try {
    const model = 'gemini-3.5-flash';
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `Search for and provide a comprehensive list of the most current and accurate standard characteristic X-ray wavelengths (K-alpha weighted averages for Cu, Mo, Co, Fe, Cr, Ag) and common neutron wavelengths (standard thermal and cold source averages). 
      Return the data in a structured JSON list.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Name of the source (e.g., 'Cu K-alpha')" },
              value: { type: Type.NUMBER, description: "Wavelength in Angstroms" },
              type: { type: Type.STRING, enum: ['X-Ray', 'Neutron'], description: "The type of radiation" }
            },
            required: ["label", "value", "type"]
          }
        }
      }
    });

    let text = response.text;
    if (!text) return [];
    text = text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
    return JSON.parse(text) as StandardWavelength[];
  } catch (error: any) {
    if (!isQuotaError(error) && !isPermissionError(error)) {
      console.error("Error fetching wavelengths:", error);
    }
    if (isQuotaError(error)) {
      return [{ label: "Cu K-alpha (Quota Fallback)", value: 1.5406, type: "X-Ray" }];
    }
    if (isPermissionError(error)) {
      return [{ label: "Cu K-alpha (Permission Fallback)", value: 1.5406, type: "X-Ray" }];
    }
    return [];
  }
};

export const getMaterialPeaks = async (query: string): Promise<AIResponse> => {
  try {
    const model = 'gemini-3.5-flash';
    
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `Provide characteristic crystallography data and major diffraction peaks for the material or query: "${query}". 
      Assume a standard X-ray wavelength of Cu K-alpha (1.5406 Angstrom) unless the user specifies otherwise. 
      Include structural parameters like lattice constants (a, b, c), space group, and theoretical density if known.
      Provide both the major peak positions (2-theta) AND their corresponding Miller indices (hkl).
      Return at least the top 5 major peaks for the Cu K-alpha wavelength.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            material: {
              type: Type.STRING,
              description: "The identified name of the material"
            },
            peaks: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "List of 2-theta angles in degrees"
            },
            hkls: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Corresponding Miller indices for each peak, e.g., '111', '200'"
            },
            wavelength: {
              type: Type.NUMBER,
              description: "The wavelength used for these peaks in Angstroms",
              nullable: true
            },
            description: {
              type: Type.STRING,
              description: "A brief one-sentence description of the material and its properties."
            },
            latticeParams: {
              type: Type.OBJECT,
              properties: {
                a: { type: Type.NUMBER },
                b: { type: Type.NUMBER },
                c: { type: Type.NUMBER },
                alpha: { type: Type.NUMBER },
                beta: { type: Type.NUMBER },
                gamma: { type: Type.NUMBER }
              },
              required: ["a"]
            },
            spaceGroup: {
              type: Type.STRING,
              description: "Space group symbol (e.g., Fm-3m, Pnma)"
            },
            density: {
              type: Type.NUMBER,
              description: "Theoretical density in g/cm³"
            }
          },
          required: ["material", "peaks"]
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    text = text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
    const result = JSON.parse(text) as AIResponse;
    result.sources = extractSources(response.candidates?.[0]?.groundingMetadata);
    
    return result;
  } catch (error: any) {
    if (!isQuotaError(error) && !isPermissionError(error)) {
      console.error("Gemini API Error:", error);
    }
    if (isQuotaError(error)) {
      throw new Error("Quota exceeded (429). Please wait and try again later.");
    }
    if (isPermissionError(error)) {
      throw new Error("Permission denied (403). Grounding with Google Search might be restricted and is required for this search.");
    }
    throw error;
  }
};

export const explainResults = async (resultsSummary: string): Promise<string> => {
   try {
    const model = 'gemini-3.5-flash';
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `As a crystallography expert, briefly interpret these diffraction results: ${resultsSummary}. Focus on d-spacing trends and potential crystal quality indicators. Keep it under 50 words.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Could not generate explanation.";
   } catch (error: any) {
    if (isQuotaError(error)) {
       return "Analysis unavailable: Quota exceeded.";
    }
    if (isPermissionError(error)) {
       return "Analysis unavailable: Permission denied for grounding tools.";
    }
     return "Analysis unavailable.";
   }
};

export interface OCRAnalysisResult {
  text: string;
  structuredData?: {
    extracted_lines?: string[];
    peaks?: Array<{ twoTheta: number; intensity: number; dSpacing?: number; hkl?: string }>;
    phases?: Array<{ phaseName: string; pdfNumber?: string; fom?: number; spaceGroup?: string }>;
    axis?: { twoThetaMin?: number; twoThetaMax?: number; wavelength?: number };
    confidence?: string;
  };
  engine?: string;
}

export const analyzeImageOCR = async (
  imageBase64: string, 
  customPrompt?: string, 
  ocrMode: 'full_ocr' | 'table_extraction' | 'label_phase' | 'axis_calibration' = 'full_ocr'
): Promise<OCRAnalysisResult> => {
  try {
    const customKey = localStorage.getItem('xrd_custom_gemini_key') || localStorage.getItem('gemini_custom_api_key') || undefined;
    const response = await fetch('/api/gemini/ocr-image-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        customPrompt,
        ocrMode,
        customKey
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Gemini OCR Analysis failed');
    }

    return {
      text: data.text || 'No text extracted.',
      structuredData: data.structuredData || undefined,
      engine: data.engine || 'Google Gemini 3.6 OCR Engine'
    };
  } catch (error: any) {
    if (isQuotaError(error)) throw new Error('Quota exceeded (429).');
    if (isPermissionError(error)) throw new Error('Permission denied (403). Check API Key configuration.');
    throw error;
  }
};

export const analyzeDiffractionImage = async (imageBase64: string, userContext: string): Promise<string> => {
  const result = await analyzeImageOCR(imageBase64, userContext, 'full_ocr');
  return result.text;
};

// A robust similarity score function for XRD spectra
function getXrdPatternSimilarity(expPeaks: {twoTheta: number, intensity: number}[], refPatternStr: string): number {
  if (!refPatternStr) return 0;
  // Parse reference pattern, which is of format "25.8, 100\n31.8, 50" (newlines or commas)
  const refPeaks = refPatternStr.split(/[,\n;]+/).map(s => {
    const clean = s.trim();
    if (!clean) return null;
    const parts = clean.split(/[\s,]+/);
    const twoTheta = parseFloat(parts[0]);
    const intensity = parts.length > 1 ? parseFloat(parts[1]) : 100;
    return { twoTheta, intensity };
  }).filter((p): p is {twoTheta: number, intensity: number} => p !== null && !isNaN(p.twoTheta));

  if (refPeaks.length === 0 || expPeaks.length === 0) return 0;

  let score = 0;
  const tolerance = 0.35; // 2-theta tolerance in degrees

  expPeaks.forEach(ePeak => {
    const matches = refPeaks.filter(rPeak => Math.abs(rPeak.twoTheta - ePeak.twoTheta) <= tolerance);
    if (matches.length > 0) {
      const closest = matches.reduce((prev, curr) => 
        Math.abs(curr.twoTheta - ePeak.twoTheta) < Math.abs(prev.twoTheta - ePeak.twoTheta) ? curr : prev
      );
      const proximityFactor = 1 - (Math.abs(closest.twoTheta - ePeak.twoTheta) / tolerance);
      const intensityRatio = Math.min(ePeak.intensity, closest.intensity) / Math.max(ePeak.intensity, closest.intensity);
      score += proximityFactor * (0.7 + 0.3 * intensityRatio);
    }
  });

  const potentialMax = Math.max(expPeaks.length, refPeaks.length);
  return score / potentialMax;
}

export const analyzePhaseID = async (xrdDataText: string): Promise<string> => {
  try {
    const model = 'gemini-3.1-pro-preview';
    
    // Parse the experimental data text from the user
    const expPeaks: {twoTheta: number, intensity: number}[] = [];
    const lines = xrdDataText.split('\n');
    lines.forEach(line => {
      const parts = line.trim().split(/[\s,]+/);
      if (parts.length >= 1) {
        const twoTheta = parseFloat(parts[0]);
        const intensity = parts.length > 1 ? parseFloat(parts[1]) : 100;
        if (!isNaN(twoTheta)) {
          expPeaks.push({ twoTheta, intensity });
        }
      }
    });

    // Score all materials in the DB
    const matches = MATERIAL_DB.map(mat => {
      const score = getXrdPatternSimilarity(expPeaks, mat.pattern || '');
      return { material: mat, score };
    })
    .filter(m => m.score > 0.03)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4); // Top 4 matches

    let ragContext = "=== CRITICAL GROUNDING CONTEXT RETRIEVED FROM LOCAL DIFFRACTION PDF-DATABASE (RAG) ===\n";
    if (matches.length > 0) {
      ragContext += "The RAG similarity index analyzed the experimental peak matrix and retrieved the following best-fit crystallographic reference standards. Prioritize evaluating if the sample is one of these candidate phases or a combination:\n\n";
      matches.forEach((m, idx) => {
        const mat = m.material;
        ragContext += `[Candidate Class ${idx + 1}] Similarity Match Score: ${(m.score * 100).toFixed(1)}%\n`;
        ragContext += `- Phase Name: ${mat.name}\n`;
        ragContext += `- Formula: ${mat.formula}\n`;
        ragContext += `- Crystal System: ${mat.crystalSystem || "Unknown"}\n`;
        ragContext += `- Space Group: ${mat.spaceGroup || "Unknown"}\n`;
        ragContext += `- Theoretical Calculated Density: ${mat.density || "Unknown"} g/cm³\n`;
        ragContext += `- Reference Elastic Modulus: ${mat.elasticModulus || "Unknown"} GPa\n`;
        ragContext += `- Practical Applications: ${mat.applications?.join(', ') || "N/A"}\n`;
        ragContext += `- Known Reference XRD Peaks (2-thetas & intensities):\n${mat.pattern}\n`;
        ragContext += `- Structural Info: ${mat.description}\n\n`;
      });
    } else {
      ragContext += "No highly similar reference patterns were matching inside the current local PDF standard suite. Please perform full scientific inductive search.\n";
    }

    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `You are an expert Crystallographer and Materials Science AI. Your task is to analyze the provided X-ray Diffraction (XRD) data (2-theta positions, d-spacing, and relative intensities) to identify the material phase and distinguish between closely related crystal structures.

${ragContext}

When evaluating the data, you must strictly apply the following crystallographic rules:
1. **Peak Positions & Lattice Parameters:** Calculate or infer the lattice constant (a) using Bragg's Law. Even minor shifts in 2-theta positions (e.g., between GaAs and ZnSe) must be used to differentiate isostructural materials.
2. **Extinction Rules & Space Groups:** Identify the Bravais lattice and space group based on allowed and forbidden reflections (hkl indices).
3. **Atomic Structure Factor ($F_{hkl}$) & Peak Intensities:** Pay critical attention to relative intensities caused by differences in atomic number (Z). For isostructural materials (like Zincblende GaAs vs. ZnSe), evaluate specific weak or anomalous peaks (e.g., the (200) reflection) where the intensity depends on |f_anion - f_cation|.

Input Experimental Data:
${xrdDataText}

Provide a structured analysis including:
- Identified Material Phase(s) and Space Group (including matching candidates from the retrieved RAG context if applicable).
- Lattice Parameter estimation.
- Step-by-step reasoning explaining how peak intensities (especially anomalous or weak reflections) ruled out similar candidate materials.`,
      config: {
        systemInstruction: "You are an expert Crystallographer and Materials Science AI. You perform Retrieval-Augmented Generation (RAG) validations.",
        tools: [{ googleSearch: {} }], // Allow grounding
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text || "Analysis unavailable.";
  } catch (error: any) {
    if (isQuotaError(error)) return "Analysis unavailable: Quota exceeded.";
    if (isPermissionError(error)) return "Analysis unavailable: Permission denied.";
    return "Analysis unavailable: Error communicating with AI.";
  }
};

export const enhanceScientificPrompt = async (
  prompt: string, 
  style: string, 
  config?: {
    lighting?: string;
    perspective?: string;
    colorScheme?: string;
    addAnnotations?: boolean;
    addGridLines?: boolean;
    addForceVectors?: boolean;
  }
): Promise<string> => {
  try {
    const model = 'gemini-3.5-flash';
    let systemDetails = '';
    if (config) {
      if (config.lighting) systemDetails += `- Use ${config.lighting} lighting specifically.\n`;
      if (config.perspective) systemDetails += `- Use a ${config.perspective} perspective/camera angle.\n`;
      if (config.colorScheme) systemDetails += `- Employ a ${config.colorScheme} color scheme/palette.\n`;
      if (config.addGridLines) systemDetails += `- Include fine technical grid overlay lines and spatial calibration marks.\n`;
      if (config.addAnnotations) systemDetails += `- Include clean, minimal scientific text annotations with leader lines, labeling d-spacing and crystallographic axes.\n`;
      if (config.addForceVectors) systemDetails += `- Add clean vector force arrows (indicating atomic displacements, stress fields, or wave vectors).\n`;
    }
    
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `You are an expert scientific illustrator working for academic journals. Transform the following user description into a detailed, high-quality, professional image generation prompt.

Visual Style: ${style}
User Concept: "${prompt}"
${systemDetails}

Ensure the resulting prompt describes a polished, crisp, ultra-high-resolution, professionally rendered schematic with no clutter or blurry artifacts. Focus on rich rendering details, clear material textures (like glass, metal bond spheres, electron density gas, or textured SEM structures), and strict physical fidelity.

Output ONLY the enhanced prompt as a single paragraph. Do not include any introductory or concluding text, notes, markdown blocks, or quotes.`,
    });
    return response.text?.trim() || prompt;
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return prompt;
  }
};

export const generateMatplotlibCode = async (prompt: string, presetType?: string): Promise<string> => {
  try {
    const model = 'gemini-3.5-flash';
    const presetContext = presetType ? `The user is starting from a preset plot type of: "${presetType}". ` : '';
    
    const response = await getGeminiClient().models.generateContent({
      model,
      contents: `You are an expert scientific data visualizer who writes high-quality Python code using Matplotlib and NumPy.
      Write a complete, professional, and visually stunning Python script to generate a scientific plot or mathematical model illustration based on this prompt: "${prompt}".
      ${presetContext}
      
      STRICT DESIGN & FUNCTIONAL RULES:
      1. Color Palette: Use a clean, professional dark slate/cyber theme for academic presentation (Dark background: '#0f172a' or transparent, axes labels: '#94a3b8', grid: '#1e293b', lines/curves: use high-contrast vibrant colors like '#38bdf8', '#f43f5e', '#10b981', '#f59e0b').
      2. Set figure and axes background explicitly to match the slate/dark theme:
         fig, ax = plt.subplots(figsize=(6.5, 5))
         fig.patch.set_facecolor('#0f172a')
         ax.set_facecolor('#0f172a')
         ax.tick_params(colors='#94a3b8', labelsize=9)
         ax.xaxis.label.set_color('#94a3b8')
         ax.yaxis.label.set_color('#94a3b8')
         ax.title.set_color('#f1f5f9')
         ax.grid(True, color='#1e293b', linestyle='--', alpha=0.7)
         for spine in ax.spines.values():
             spine.set_color('#334155')
      3. Use a high DPI or clean line/marker style to present clear scientific data points.
      4. DO NOT call plt.show(). The backend runner is responsible for extracting the active figure.
      5. Output ONLY the raw executable Python code.
      6. Remove any markdown triple backtick fences (\`\`\`) in your output. Just output pure Python code blocks.`,
    });
    
    let text = response.text || "";
    text = text.replace(/```python\n?/g, "").replace(/\n?```/g, "").trim();
    return text;
  } catch (error) {
    console.error("Error generating Matplotlib code:", error);
    throw error;
  }
};

export const createSupportChat = (isSmart: boolean = false): Chat => {
  return getGeminiClient().chats.create({
    model: 'gemini-3.5-flash',
    config: {
      systemInstruction: "You are 'Crystal', the AI support assistant for the Bragg-Engine crystallography app. You are helpful, scientifically accurate, and concise. You help users (especially Raf) understand diffraction concepts (Bragg's law, Scherrer equation, Rietveld refinement) and navigate the app. Use the Google Search tool to provide accurate, up-to-date scientific information.",
      tools: [{ googleSearch: {} }]
    }
  });
};

export interface FlashMaterialSearchResult {
  name: string;
  formula: string;
  crystalSystem: string;
  spaceGroup: string;
  spaceGroupNumber?: number;
  latticeParams?: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
    volume?: number;
  };
  density?: number;
  molecularWeight?: number;
  elasticModulus?: number;
  zValue?: number;
  databaseSource?: string;
  databaseCardId?: string;
  description?: string;
  type?: string;
  applications?: string[];
  elements?: string[];
  peaks: Array<{
    twoTheta: number;
    intensity: number;
    h: number;
    k: number;
    l: number;
    hkl?: string;
    dSpacing: number;
    fwhm?: number;
  }>;
  pattern: string;
  synthesisRef?: string;
  confidenceScore?: number;
  isLearned?: boolean;
  learnedAt?: string;
}

export const searchMaterialWithGeminiFlash = async (
  query: string,
  wavelength: number = 1.54059,
  customKey?: string
): Promise<{ success: boolean; material?: FlashMaterialSearchResult; error?: string; modelUsed?: string }> => {
  try {
    const keyToUse = customKey || localStorage.getItem('gemini_custom_api_key') || "";
    const response = await fetch('/api/gemini/material-search-flash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        wavelength,
        customKey: keyToUse
      })
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Gemini Flash Material Search Client Error:", error);
    return {
      success: false,
      error: error.message || "Failed to connect to Gemini 3.6 Flash search service."
    };
  }
};

export const fetchLearnedMaterials = async (): Promise<FlashMaterialSearchResult[]> => {
  try {
    const res = await fetch('/api/materials/learned');
    const data = await res.json();
    if (data.success && Array.isArray(data.materials)) {
      return data.materials;
    }
    return [];
  } catch (err) {
    console.error("Error fetching learned materials:", err);
    return [];
  }
};

export const saveLearnedMaterial = async (
  material: FlashMaterialSearchResult,
  rawExperimentalData?: Array<{ twoTheta: number; intensity: number }>
): Promise<{ success: boolean; message?: string; material?: FlashMaterialSearchResult; error?: string }> => {
  try {
    const payload = {
      ...material,
      rawExperimentalData: rawExperimentalData || null
    };

    const res = await fetch('/api/materials/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error saving learned material:", err);
    return { success: false, error: err.message };
  }
};

export const deleteLearnedMaterial = async (name: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/materials/learned/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Error deleting learned material:", err);
    return false;
  }
};
