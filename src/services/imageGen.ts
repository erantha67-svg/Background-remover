import { GoogleGenAI } from "@google/genai";
import { callGeminiWithRetry } from "./geminiUtils";

let aiInstance: any = null;

function getAI() {
  const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  const rawApiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;
  const apiKey = rawApiKey?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables or enter it in the settings.");
  }
  
  if (!aiInstance || (aiInstance as any)._apiKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
    (aiInstance as any)._apiKey = apiKey;
  }
  
  return aiInstance;
}

export async function generateImage(prompt: string, size: '1K' | '2K' | '4K' = '1K') {
  const ai = getAI();
  
  const apiCall = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
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

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    throw new Error("No image data returned from model.");
  };

  try {
    return await callGeminiWithRetry(apiCall);
  } catch (error: any) {
    console.error("Image Generation Error after retries:", error);
    throw error;
  }
}
