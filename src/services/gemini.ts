import { GoogleGenAI } from "@google/genai";
import { callGeminiWithRetry, handleGeminiError } from "./geminiUtils";

// Lazy initialization to prevent crash if API key is missing at load time
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  const rawApiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;
  const apiKey = rawApiKey?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables or enter it in the settings.");
  }
  
  console.log(`Using API key starting with: ${apiKey.substring(0, 8)}...`);

  // Recreate instance if key changes or doesn't exist
  if (!aiInstance || (aiInstance as any)._apiKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
    // Store the key on the instance for comparison (hacky but works for this check)
    (aiInstance as any)._apiKey = apiKey;
  }
  
  return aiInstance;
}

export async function removeBackground(base64Image: string, mimeType: string): Promise<string> {
  const ai = getAI();
  
  const apiCall = async () => {
    // Using gemini-2.5-flash-image for maximum compatibility
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Remove the background from this image. Keep only the apparel item (e.g., t-shirt, hoodie, pants). The output MUST be the same image but with the background replaced by absolute transparency (alpha channel). Do not add any text, borders, or other elements. Focus on clean edges around the fabric texture.",
          },
        ],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      console.error("Gemini Response Error: No candidates or parts found", response);
      throw new Error("The AI model did not return a valid response. Please try a different image.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
        console.log("Gemini returned text instead of image:", part.text);
      }
    }

    throw new Error("No image data was found in the AI response. The image might be too complex or violate safety guidelines.");
  };

  try {
    return await callGeminiWithRetry(apiCall);
  } catch (error: any) {
    console.error("Error removing background after retries:", error);
    // handleGeminiError is already called within callGeminiWithRetry, 
    // but we re-throw to be safe or handle any final errors here.
    throw error;
  }
}
