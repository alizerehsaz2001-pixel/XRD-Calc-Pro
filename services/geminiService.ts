
import { GoogleGenAI, Type, Chat, GroundingChunk, ThinkingLevel } from "@google/genai";
import { AIResponse, GroundingSource, StandardWavelength } from '../types';
import { MATERIAL_DB } from "../utils/materialDB";

// Initialize Gemini Client using process.env.GEMINI_API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

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

export const generateScientificImage = async (prompt: string, size: '1K' | '2K' | '4K', styleLabel?: string): Promise<string | null> => {
  // Create a new instance to ensure the most up-to-date API key is used (if selected via UI)
  const dynamicAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const styleContext = styleLabel ? ` in the style of a ${styleLabel}` : '';
  const fullPrompt = `Generate a high-quality scientific illustration or diagram suitable for crystallography analysis${styleContext}. Prompt: ${prompt}`;

  // Method 1: Try using standard Imagen 3.0 model with generateImages (the correct API for Imagen)
  try {
    const response = await dynamicAi.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response?.generatedImages?.[0]?.image?.imageBytes) {
      return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    return null;
  } catch (error: any) {
    if (isQuotaError(error) || isPermissionError(error)) {
      if (isQuotaError(error)) throw new Error("Quota exceeded (429).");
      if (isPermissionError(error)) throw new Error("Permission denied (403). API key might not have image generation access.");
      throw error;
    }

    // Method 2: Fallback to the multimodal image generation model using generateContent
    try {
      const response = await dynamicAi.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: fullPrompt
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
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
      return null;
    } catch (fallbackError: any) {
      console.error("All image generation methods failed. Main error was:", error, "Fallback error was:", fallbackError);
      if (isQuotaError(fallbackError)) throw new Error("Quota exceeded (429).");
      if (isPermissionError(fallbackError)) throw new Error("Permission denied (403). API key might not have image generation access.");
      throw fallbackError;
    }
  }
};

export const fetchStandardWavelengths = async (): Promise<StandardWavelength[]> => {
  try {
    const model = 'gemini-3.5-flash';
    const response = await ai.models.generateContent({
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
    
    const response = await ai.models.generateContent({
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
    const response = await ai.models.generateContent({
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

export const analyzeDiffractionImage = async (imageBase64: string, userContext: string): Promise<string> => {
  try {
    const model = 'gemini-3.5-flash';
    
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      throw new Error("Invalid image format");
    }
    const mimeType = matches[1];
    const data = matches[2];

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: `Analyze this crystallography image acting as an expert crystallographer. Context provided by user: "${userContext}".
            
            1. **Diffraction Patterns (XRD):** If the image is a diffraction plot:
               - Identify visible peaks.
               - **QUANTITATIVE EXTRACTION:** Create a Markdown table listing the approximate **2-theta (2θ)** position and **Relative Intensity (%)** for the major peaks observed.
               - Analyze peak width qualitatively (Sharp vs Broad).
            
            2. **Software Screenshots/Data:** If this is a screenshot from software like HighScore, EVA, or a data table:
               - Extract candidate phase names and their matching scores (FOM).
               - Interpret statistical fit values if visible.
            
            3. **Conclusion:** Provide a summary of the likely material composition and data quality.
            
            Be precise.`
          }
        ]
      },
      config: {
      }
    });

    return response.text || "No analysis could be generated for this image.";
  } catch (error: any) {
    if (!isQuotaError(error) && !isPermissionError(error)) {
      console.error("Gemini Image Analysis Error:", error);
    }
    if (isQuotaError(error)) throw new Error("Quota exceeded (429).");
    if (isPermissionError(error)) throw new Error("Permission denied (403). API key might result in restriction for image analysis.");
    throw error;
  }
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

    const response = await ai.models.generateContent({
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
    
    const response = await ai.models.generateContent({
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

export const createSupportChat = (isSmart: boolean = false): Chat => {
  return ai.chats.create({
    model: 'gemini-3.5-flash',
    config: {
      systemInstruction: "You are 'Crystal', the AI support assistant for the Bragg-Engine crystallography app. You are helpful, scientifically accurate, and concise. You help users (especially Raf) understand diffraction concepts (Bragg's law, Scherrer equation, Rietveld refinement) and navigate the app. Use the Google Search tool to provide accurate, up-to-date scientific information.",
      tools: [{ googleSearch: {} }]
    }
  });
};
