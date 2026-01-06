
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIWineResponse, WineType } from "../types";

const API_KEY = process.env.API_KEY || "";

export const analyzeWineLabel = async (base64Image: string): Promise<AIWineResponse> => {
  if (!API_KEY) {
    throw new Error("Missing Gemini API Key. Please ensure the environment is configured correctly.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = "Analyze this wine label. Extract the following information in JSON format: name of the wine, the maker/winery, the vintage year, the type (categorize as exactly one of: Red, White, Rosé, Champagne/Sparkling, or Other), and a brief professional tasting description.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            maker: { type: Type.STRING },
            year: { type: Type.STRING },
            type: { 
              type: Type.STRING,
              description: "Must be one of: Red, White, Rosé, Champagne/Sparkling, Other"
            },
            description: { type: Type.STRING }
          },
          required: ["name", "maker", "year", "type", "description"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("The AI returned an empty response. The label might be too blurry or not visible.");
    }

    const data = JSON.parse(response.text);
    return {
      name: data.name || "Unknown Wine",
      maker: data.maker || "Unknown Maker",
      year: data.year || "N/V",
      type: (Object.values(WineType).includes(data.type as WineType) ? data.type as WineType : WineType.OTHER),
      description: data.description || ""
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    if (error.message?.includes("fetch")) {
      throw new Error("Network error: Could not reach the AI service. Please check your internet connection.");
    }
    if (error instanceof SyntaxError) {
      throw new Error("Failed to process the AI response. Try taking a clearer photo.");
    }
    throw new Error(error.message || "An unexpected error occurred during wine label analysis.");
  }
};
