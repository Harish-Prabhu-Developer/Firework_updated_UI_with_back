import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export const extractProductsFromVoice = async (transcript: string) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const prompt = `
Context: You are a POS billing assistant for a Firecrackers shop.
Task: Extract product names, quantities, and intended actions from the user's voice transcript.

Language: Input may be in English, Tamil, or Tanglish (mix). Handle all three.

Supported Actions:
- ADD: User wants to add an item (e.g., "Add 3 crackers", "ஆட் 3 chakra").
- REMOVE: User wants to remove an item (e.g., "Remove sparklers", "நீக்கு chakra").
- UPDATE: User wants to change quantity (e.g., "Set flower pots to 10", "மாற்று testing to 5").

User Voice Command:
"${transcript}"

Output: Return JSON ONLY in this exact structure:
{
  "items": [
    {
      "action": "ADD | REMOVE | UPDATE",
      "product_name": "clean English product name",
      "quantity": 1
    }
  ]
}

Rules:
1. Identify all products and their actions.
2. If no action is specified, default to "ADD".
3. Translate Tamil/Tanglish product names to English (e.g., 'chakra' stays, 'vidi' = 'crackers', 'இரண்டு'=2, 'மூன்று'=3, 'rendu'=2, 'moonru'=3, 'sky shot'=sky shot). Convert any word-based numbers to numerics.
4. If no quantity is mentioned, assume 1.
5. Return ONLY valid JSON, no markdown.
`;

  // Retry with exponential backoff — handles 429 rate limit gracefully
  const MAX_RETRIES = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (!response.text) return { items: [] };

      const text = response.text.trim();
      const jsonStr = text.startsWith('```') ? text.replace(/^```(json)?/, '').replace(/```$/, '').trim() : text;
      return JSON.parse(jsonStr);

    } catch (error: any) {
      lastError = error;
      const status = error?.status ?? error?.response?.status;
      if (status === 429) {
        // Extract retry delay from error message if available
        const delayMatch = error?.message?.match(/(\d+(?:\.\d+)?)s/);
        const delaySec = delayMatch ? parseFloat(delayMatch[1]) : attempt * 10;
        const delayMs = Math.min(delaySec * 1000, 60000); // cap at 60s
        console.warn(`[Gemini] Rate limited (429). Retrying in ${delaySec.toFixed(1)}s... (attempt ${attempt}/${MAX_RETRIES})`);
        if (attempt < MAX_RETRIES) {
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
      }
      // Non-429 error or max retries exceeded — rethrow
      throw error;
    }
  }

  throw lastError;
};

export const extractProductsFromAudio = async (audioFiles: any[]) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in environment variables');
  }

  const audioParts = await Promise.all(audioFiles.map(async (file) => {
    const fileBuffer = await fs.promises.readFile(file.path);
    return {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: file.mimetype || 'audio/mp4',
      },
    };
  }));

  const promptText = `
Context: You are a POS billing assistant for a Firecrackers shop.
Task: Listen to the provided audio(s) and extract product names, quantities, and intended actions.

Language: Input may be in English, Tamil, or Tanglish (mix). Handle all three.

Supported Actions:
- ADD: User wants to add an item.
- REMOVE: User wants to remove an item.
- UPDATE: User wants to change quantity.

Output: Return JSON ONLY in this exact structure:
{
  "items": [
    {
      "action": "ADD | REMOVE | UPDATE",
      "product_name": "clean English product name",
      "quantity": 1
    }
  ]
}

Rules:
1. Listen carefully to all audio segments to identify all products and their actions.
2. If no action is specified, default to "ADD".
3. Translate Tamil/Tanglish product names to English.
4. Convert word-based numbers to numerics.
5. If no quantity is mentioned, assume 1.
6. Return ONLY valid JSON, no markdown.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: promptText },
            ...audioParts
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (!response.text) return { items: [] };

    const text = response.text.trim();
    const jsonStr = text.startsWith('```') ? text.replace(/^```(json)?/, '').replace(/```$/, '').trim() : text;
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error('[Gemini Audio] Error:', error);
    throw error;
  }
};
