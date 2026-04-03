import { GoogleGenAI } from "@google/genai";

/**
 * Shared utility for calling Gemini API with retry logic and better error handling.
 */

export async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorString = JSON.stringify(error);
      const isQuotaError = errorString.includes("429") || 
                          errorString.includes("RESOURCE_EXHAUSTED") || 
                          error.message?.toLowerCase().includes("quota");

      if (isQuotaError && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Gemini API quota hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not a quota error or we've exhausted retries, throw a descriptive error
      handleGeminiError(error);
    }
  }
  
  throw lastError;
}

export function handleGeminiError(error: any): never {
  const errorString = JSON.stringify(error);
  
  if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED") || error.message?.toLowerCase().includes("quota")) {
    throw new Error(
      "API Quota Exceeded: You've hit the rate limit for the current Gemini API key. " +
      "Please wait a few minutes, or go to 'API Settings' and enter your own personal API key from ai.google.dev for higher limits."
    );
  }
  
  if (errorString.includes("403") || errorString.includes("PERMISSION_DENIED")) {
    throw new Error(
      "API Permission Denied: Your API key might not have permission for this model. " +
      "Please verify your API key at ai.google.dev and ensure the 'Generative Language API' is enabled."
    );
  }

  if (errorString.includes("401") || errorString.includes("UNAUTHENTICATED") || error.message?.toLowerCase().includes("key not valid")) {
    throw new Error(
      "Invalid API Key: The provided Gemini API key is not valid. " +
      "Please check your 'API Settings' and ensure the key is copied correctly from ai.google.dev."
    );
  }
  
  if (error.message?.toLowerCase().includes("safety")) {
    throw new Error("Safety Filter: The content was flagged by Gemini's safety filters. Please try a different prompt or image.");
  }
  
  throw error;
}
