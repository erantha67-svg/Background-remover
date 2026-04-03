import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent crash if API key is missing at load time
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.Gemini_API_Key;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please set it in your environment variables or enter it in the settings.");
  }
  // If the key has changed, we need to recreate the instance
  if (aiInstance && (aiInstance as any)._apiKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
  } else if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function removeBackground(base64Image: string, mimeType: string): Promise<string> {
  try {
    const ai = getAI();
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
  } catch (error: any) {
    console.error("Error removing background:", error);
    
    // Handle specific API errors
    const errorString = JSON.stringify(error);
    
    if (errorString.includes("403") || errorString.includes("PERMISSION_DENIED")) {
      throw new Error("API Permission Denied: Your API key might not have permission for this model, or the Generative Language API is not enabled in your Google Cloud project. Please check your API key settings at ai.google.dev.");
    }
    
    if (error.message?.includes("safety")) {
      throw new Error("The image was flagged by safety filters. Please try another image.");
    }
    
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      throw new Error("API quota exceeded. Please try again in a few minutes.");
    }
    
    throw error;
  }
}
