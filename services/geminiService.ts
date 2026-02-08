
import { GoogleGenAI, Type } from "@google/genai";
import { HashtagReport, TimePeriod } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeHashtag(period: TimePeriod): Promise<HashtagReport> {
  const prompt = `
    Perform a real-time analysis/scrape of X (formerly Twitter) for the hashtag "#keep4o".
    1. Find the current total number of posts/mentions as of this exact moment.
    2. Retrieve or generate a list of 5 recent "live" sample posts (include user, handle, text, and timestamp).
    3. Provide a detailed report for the period: ${period}.
    
    Use Google Search to find real, up-to-date data points. 
    Provide the response in JSON format including:
    - currentStats (totalMentions, growthRate %, averageSentiment, estimatedReach).
    - trendData for the specified period (breakdown by smaller intervals if possible).
    - liveMentions (array of 5 items with id, user, handle, text, timestamp).
    - summary of current movement status.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentStats: {
              type: Type.OBJECT,
              properties: {
                totalMentions: { type: Type.NUMBER },
                growthRate: { type: Type.NUMBER },
                averageSentiment: { type: Type.STRING },
                estimatedReach: { type: Type.STRING }
              },
              required: ["totalMentions", "growthRate", "averageSentiment", "estimatedReach"]
            },
            trendData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  count: { type: Type.NUMBER },
                  sentiment: { type: Type.NUMBER },
                  reach: { type: Type.NUMBER }
                },
                required: ["date", "count", "sentiment", "reach"]
              }
            },
            liveMentions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  user: { type: Type.STRING },
                  handle: { type: Type.STRING },
                  text: { type: Type.STRING },
                  timestamp: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["currentStats", "trendData", "summary"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Source",
      uri: chunk.web?.uri || "#"
    })) || [];

    return {
      ...data,
      sources
    };
  } catch (error) {
    console.error("Error fetching hashtag data:", error);
    throw error;
  }
}
