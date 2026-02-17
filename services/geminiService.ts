
import { GoogleGenAI, Type, Chat, GroundingChunk } from "@google/genai";
import { AIResponse, CrystalMindResponse, GroundingSource } from '../types';

// Initialize Gemini Client using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractSources = (metadata: any): GroundingSource[] => {
  if (!metadata?.groundingChunks) return [];
  return metadata.groundingChunks
    .map((chunk: GroundingChunk) => {
      if (chunk.web) {
        return { title: chunk.web.title, uri: chunk.web.uri };
      }
      return null;
    })
    .filter((s: any): s is GroundingSource => s !== null);
};

export const getMaterialPeaks = async (query: string): Promise<AIResponse> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Provide characteristic crystallography data and major diffraction peaks for the material or query: "${query}". 
      Assume a standard X-ray wavelength of Cu K-alpha (1.5406 Angstrom) unless the user specifies otherwise. 
      Include structural parameters like lattice constants (a, b, c), space group, and theoretical density if known.
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

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text) as AIResponse;
    result.sources = extractSources(response.candidates?.[0]?.groundingMetadata);
    
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const explainResults = async (resultsSummary: string): Promise<string> => {
   try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `As a crystallography expert, briefly interpret these diffraction results: ${resultsSummary}. Focus on d-spacing trends and potential crystal quality indicators. Keep it under 50 words.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text || "Could not generate explanation.";
   } catch (error) {
     return "Analysis unavailable.";
   }
};

export const analyzeDiffractionImage = async (imageBase64: string, userContext: string): Promise<string> => {
  try {
    const model = 'gemini-3-pro-preview';
    
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
            text: `Analyze this crystallography image. Context provided by user: "${userContext}".
            
            1. If this is a diffraction pattern (XRD), identify visible peaks, background noise levels, and potential symmetry.
            2. If this is a screenshot from software like HighScore or a data table, interpret the scores, candidate phases, and statistical fit values.
            3. Provide a summary of the likely material composition and data quality.
            
            Be precise and act as an expert crystallographer.`
          }
        ]
      },
      config: {
        thinkingConfig: {
          thinkingBudget: 32768, 
        }
      }
    });

    return response.text || "No analysis could be generated for this image.";
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw error;
  }
};

export const createSupportChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are 'Crystal', the AI support assistant for the Bragg-Engine crystallography app. You are helpful, scientifically accurate, and concise. You help users (especially Raf) understand diffraction concepts (Bragg's law, Scherrer equation, Rietveld refinement) and navigate the app. Use the Google Search tool to provide accurate, up-to-date scientific information.",
      tools: [{ googleSearch: {} }]
    }
  });
};

// --- CrystalMind-Control (Database Integration) ---

export const searchCrystalDatabase = async (command: string, elements: string[], peaks?: number[]): Promise<CrystalMindResponse> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    let prompt = `You are "CrystalMind-Control", the database integration and search orchestration module for the CrystalMind AI platform.
    Your role is to interface between the user's diffraction data and external crystallographic databases. 
    PRIORITY: Connect and retrieve data from the Materials Project (materialsproject.org) and COD (crystallography.net).

    MISSION:
    Translate user requests or raw diffraction patterns into precise database search queries. Retrieve candidate phases, CIF files, and crystallographic metadata required for Rietveld refinement and phase identification.

    INPUT CONTEXT:
    - User Command: "${command}"
    - Elements: ${elements.join(', ')}
    - Observed Peaks: ${peaks ? peaks.join(', ') : 'None provided'}

    OPERATIONAL LOGIC:
    1. Search by Composition: If elements provided, find matching compounds in Materials Project or COD.
    2. Search by Peak Match: If peaks provided, perform a fingerprint search using d-spacing tolerance against known standards.
    3. Data Retrieval: Extract structural, electronic, and thermodynamic properties.
    
    REQUIRED PROPERTIES PER RESULT:
    - Formula & Phase Name
    - Database ID (mp-ID or COD-ID)
    - Space Group & Point Group
    - Crystal System (Cubic, Tetragonal, etc.)
    - Lattice Parameters (a, b, c, alpha, beta, gamma)
    - Volume (Å³) & Density (g/cm³)
    - Energy Above Hull (eV/atom) - stability measure
    - Band Gap (eV)
    - Stability Status (is_stable: boolean)

    SUPPORTED DATABASES: Materials Project (Priority), COD, AMCSD.
    
    REQUIREMENT: Use Google Search tool to find real, verified Database IDs (especially Materials Project IDs and COD IDs) and structural parameters. Do not hallucinate lattice constants.

    OUTPUT SCHEMA (STRICT JSON):
    {
      "module": "CrystalMind-Control",
      "action": "Database_Search",
      "status": "success",
      "query_parameters": {
        "elements_included": [string],
        "elements_excluded": [string],
        "strict_match": boolean,
        "database_target": "COD" | "MaterialsProject" | "AMCSD" | "All"
      },
      "search_results": [
        {
          "phase_name": string,
          "formula": string,
          "database_id": string,
          "space_group": string,
          "crystal_system": string,
          "point_group": string,
          "lattice_params": {
            "a": float, "b": float, "c": float,
            "alpha": float, "beta": float, "gamma": float
          },
          "volume": float,
          "density": float,
          "energy_above_hull": float,
          "band_gap": float,
          "is_stable": boolean,
          "figure_of_merit": float (0.0 - 1.0),
          "cif_url": string
        }
      ],
      "control_message": string
    }

    Return ONLY the JSON. No markdown formatting.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(jsonString) as CrystalMindResponse;
    result.sources = extractSources(response.candidates?.[0]?.groundingMetadata);
    
    return result;

  } catch (error) {
    console.error("CrystalMind-Control Search Error:", error);
    return {
      module: "CrystalMind-Control",
      action: "Database_Search",
      status: "error",
      query_parameters: { elements_included: elements, elements_excluded: [], strict_match: false, database_target: "All" },
      search_results: [],
      control_message: "Search protocol failed. Database connectivity offline or query malformed."
    };
  }
};
