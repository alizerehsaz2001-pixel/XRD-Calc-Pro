
import { GoogleGenAI, Type, Chat, GroundingChunk } from "@google/genai";
import { AIResponse, CrystalMindResponse, GroundingSource, StandardWavelength } from '../types';

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

export const fetchStandardWavelengths = async (): Promise<StandardWavelength[]> => {
  try {
    const model = 'gemini-3-flash-preview';
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

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as StandardWavelength[];
  } catch (error) {
    console.error("Error fetching wavelengths:", error);
    return [];
  }
};

export const getMaterialPeaks = async (query: string): Promise<AIResponse> => {
  try {
    const model = 'gemini-3-flash-preview';
    
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

export const searchCrystalDatabase = async (command: string, elements: string[], target: "MaterialsProject" | "COD" | "AMCSD" | "All", peaks?: number[]): Promise<CrystalMindResponse> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    // Construct domain-specific search instructions
    const targetInfo = {
      "MaterialsProject": { name: "Materials Project", domain: "materialsproject.org", idFormat: "mp-ID" },
      "COD": { name: "Crystallography Open Database (COD)", domain: "crystallography.net", idFormat: "COD-ID" },
      "AMCSD": { name: "American Mineralogist Crystal Structure Database", domain: "rruff.geo.arizona.edu", idFormat: "AMCSD-ID" },
      "All": { name: "All Databases", domain: null, idFormat: "Mixed IDs" }
    };

    const activeTarget = targetInfo[target];

    // Explicitly force site-specific searching in the system prompt
    let prompt = `You are "CrystalMind-Control", the database integration module.
    
    COMMAND: "${command}"
    ELEMENTS: ${elements.join(', ')}
    TARGET DATABASE: ${activeTarget.name}

    SEARCH PROTOCOL:
    ${target !== 'All' 
      ? `You are RESTRICTED to ${activeTarget.name}. When using the Google Search tool, you MUST strictly use the site operator: "site:${activeTarget.domain}" in your search queries to find the material page. Example: "site:${activeTarget.domain} ${elements.join(' ')} crystal structure". Do NOT retrieve data from any other domain.` 
      : 'Search across major crystallographic databases (Materials Project, COD, AMCSD).'}

    TASK:
    1. Search for phases matching the composition and/or peaks.
    2. Retrieve strictly verified data from the target database using Google Search.
    3. Return the data in the specified JSON format.

    REQUIRED FIELDS:
    - Formula, Phase Name
    - Database ID (Must verify ID exists in ${activeTarget.name})
    - Lattice Parameters (a, b, c, alpha, beta, gamma)
    - Space Group
    - Volume, Density, Band Gap, Energy Above Hull, Stability (is_stable)

    OUTPUT JSON:
    {
      "module": "CrystalMind-Control",
      "action": "Database_Search",
      "status": "success",
      "query_parameters": {
        "elements_included": [string],
        "elements_excluded": [string],
        "strict_match": boolean,
        "database_target": "${target}"
      },
      "search_results": [
        {
          "phase_name": string,
          "formula": string,
          "database_id": string,
          "space_group": string,
          "crystal_system": string,
          "point_group": string,
          "lattice_params": { "a": number, "b": number, "c": number, "alpha": number, "beta": number, "gamma": number },
          "volume": number, "density": number, "energy_above_hull": number, "band_gap": number, "is_stable": boolean,
          "figure_of_merit": number, "cif_url": string
        }
      ],
      "control_message": string
    }`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "";
    // Robust JSON cleaning
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
      query_parameters: { elements_included: elements, elements_excluded: [], strict_match: false, database_target: target },
      search_results: [],
      control_message: "Search protocol failed. Database connectivity offline or query malformed."
    };
  }
};
