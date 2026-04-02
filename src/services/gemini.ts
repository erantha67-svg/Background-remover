import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function removeBackground(base64Image: string, mimeType: string): Promise<string> {
  try {
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
            text: "Remove the background from this image. Keep only the main foreground subject (e.g., the person, the object). Return the result as an image with a transparent background. Ensure the edges are clean and sharp.",
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image returned from Gemini");
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
}
