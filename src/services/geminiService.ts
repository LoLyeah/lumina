import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LandmarkInfo {
  name: string;
  location: string;
  history: string;
  funFact: string;
}

export async function identifyAndFetchHistory(base64Image: string): Promise<LandmarkInfo> {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: "Identify this landmark. Using Google Search grounding, provide its official name, location, and a concise 2-3 paragraph history plus one interesting fun fact. Return the response in strict JSON format.",
          },
        ],
      },
    ],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          location: { type: Type.STRING },
          history: { type: Type.STRING },
          funFact: { type: Type.STRING },
        },
        required: ["name", "location", "history", "funFact"],
      },
    },
  });

  const text = result.text;
  if (!text) throw new Error("No data received from Gemini");
  return JSON.parse(text);
}

export async function generateNarration(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Narrate the following in an elegant, professional travel guide voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore sounds professional/elegant
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate narration audio");
  return base64Audio;
}
