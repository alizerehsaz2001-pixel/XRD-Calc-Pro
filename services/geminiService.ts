
import { GoogleGenAI, Type, Chat, GroundingChunk, ThinkingLevel } from "@google/genai";
import { AIResponse, GroundingSource, StandardWavelength } from '../types';

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

export const generateScientificImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string | null> => {
  // Create a new instance to ensure the most up-to-date API key is used (if selected via UI)
  const dynamicAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const model = 'imagen-3.0-generate-001'; // Fallback to a targetable name if available, or just use flash

  try {
    const response = await dynamicAi.models.generateContent({
      model,
      contents: {
        parts: [
          {
            text: `Generate a high-quality scientific illustration or diagram suitable for crystallography analysis. Prompt: ${prompt}`
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
  } catch (error: any) {
    if (!isQuotaError(error) && !isPermissionError(error)) {
      console.error("Image Generation Error:", error);
    }
    if (isQuotaError(error)) throw new Error("Quota exceeded (429).");
    if (isPermissionError(error)) throw new Error("Permission denied (403). API key might not have image generation access.");
    throw error;
  }
};

export const fetchStandardWavelengths = async (): Promise<StandardWavelength[]> => {
  try {
    const model = 'gemini-2.0-flash';
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
    const model = 'gemini-2.0-flash';
    
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
    const model = 'gemini-2.0-flash';
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
    const model = 'gemini-2.0-flash';
    
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

export const createSupportChat = (isSmart: boolean = false): Chat => {
  return ai.chats.create({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction: "You are 'Crystal', the AI support assistant for the Bragg-Engine crystallography app. You are helpful, scientifically accurate, and concise. You help users (especially Raf) understand diffraction concepts (Bragg's law, Scherrer equation, Rietveld refinement) and navigate the app. Use the Google Search tool to provide accurate, up-to-date scientific information.",
      tools: [{ googleSearch: {} }]
    }
  });
};
