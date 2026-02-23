"use server";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AISuggestion {
  name: string;
  description: string;
}

/**
 * Robustly extracts a JSON array from raw model text.
 * gemini-2.5-flash is a thinking model — it may prefix its answer with
 * conversational text like "Here is the list…". We use a regex to find the
 * first [...] block in the response so we always get clean JSON regardless.
 */
function extractJsonArray(raw: string): AISuggestion[] {
  // Strip markdown fences
  const stripped = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const startIdx = stripped.indexOf("[");
  if (startIdx === -1) {
    throw new Error(
      `No JSON array found in AI response: "${raw.slice(0, 120)}"`,
    );
  }

  let jsonStr = stripped.slice(startIdx);

  // Repair truncated JSON — the model may cut off mid-string or mid-object
  if (!jsonStr.trimEnd().endsWith("]")) {
    // Strategy 1: find last complete object boundary },{  or }]
    const lastClosingBrace = jsonStr.lastIndexOf("},");
    if (lastClosingBrace !== -1) {
      jsonStr = jsonStr.slice(0, lastClosingBrace + 1) + "]";
    } else {
      // Strategy 2: try to close an unterminated string then the object then array
      // Find the last quote-opened string and close it
      const lastQuote = jsonStr.lastIndexOf('"');
      if (lastQuote !== -1) {
        // Walk back to just before the unclosed string value started
        const beforeQuote = jsonStr.lastIndexOf(",", lastQuote);
        if (beforeQuote !== -1) {
          jsonStr = jsonStr.slice(0, beforeQuote) + "}]";
        } else {
          jsonStr = jsonStr.slice(0, lastQuote) + '""}]';
        }
      } else {
        jsonStr = jsonStr + "]";
      }
    }
  }

  let parsed: any[];
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Last-resort: strip back to last known-good object
    const idx = jsonStr.lastIndexOf("},");
    if (idx !== -1) {
      parsed = JSON.parse(jsonStr.slice(0, idx + 1) + "]");
    } else {
      throw new Error(`Could not parse AI JSON: "${raw.slice(0, 200)}"`);
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array.");
  }

  return parsed.map((item: any) => {
    if (typeof item === "string") return { name: item, description: "" };
    return {
      name: String(item.name ?? item.category ?? item),
      description: String(item.description ?? item.desc ?? ""),
    };
  });
}

async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<AISuggestion[]> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error("Failed to fetch suggestions from AI.");
  }

  const data = await response.json();
  const resultText: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new Error("Empty response from AI.");
  }

  return extractJsonArray(resultText);
}

export async function suggestCategoriesFromAI(cuisine: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is not configured.");

    const prompt = `You are a cultural food expert who grew up eating ${cuisine} food.
Suggest exactly 5 menu categories for a ${cuisine} African restaurant.
For each category:
- name: a short, natural label locals use (e.g. "Small Chops", "Pepper Soup", "Swallows & Soups")
- description: max 160 characters. Write it as a head chef would — name key ingredients or cooking technique, mention taste profile (spicy, smoky, earthy), and how locals eat it. No filler phrases.

Return ONLY a JSON array. No markdown. No extra text:
[{"name":"...","description":"..."}]`;

    const data = await callGemini(prompt, apiKey);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error suggesting categories:", error);
    return {
      success: false,
      data: [] as AISuggestion[],
      message: error.message,
    };
  }
}

export async function suggestCategoriesByPrefix(
  cuisine: string,
  prefix: string,
) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is not configured.");

    const prompt = `You are an expert ${cuisine} chef with 20 years of experience.
The customer is looking for a menu category called "${prefix}".
Suggest up to 5 real category names that match or complete "${prefix}" for a ${cuisine} restaurant.
For each, write a description (max 160 chars) exactly as a seasoned chef would describe it on a menu:
- Name the key ingredients or cooking method specific to ${cuisine} cuisine
- Describe the taste: bold, smoky, fermented, slow-cooked, etc.
- Mention the texture or how it is served (e.g. thick stew, on skewers, in clay pot)
- Keep it vivid and specific — no generic phrases like "a variety of dishes"

Return ONLY a JSON array. No markdown. No extra text:
[{"name":"...","description":"..."}]`;

    const data = await callGemini(prompt, apiKey);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error suggesting categories by prefix:", error);
    return {
      success: false,
      data: [] as AISuggestion[],
      message: error.message,
    };
  }
}
