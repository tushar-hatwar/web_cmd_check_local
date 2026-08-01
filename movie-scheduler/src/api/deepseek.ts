import type { MovieDetails, Participant, Preferences } from '../store/useAppStore';

export interface DeepSeekResponse {
  recommended_show: {
    day: string;
    time: string;
  };
  attendance: number;
  total_people: number;
  compromise_score: number;
  reason: string;
  alternative_slots: Array<{
    day: string;
    time: string;
    attendance: number;
    compromise_score: number;
    reason: string;
  }>;
}

function buildPrompt(movieDetails: MovieDetails, participants: Participant[], preferences: Preferences): string {
  return `You are an AI scheduling assistant for group movie bookings.
Analyze everyone's availability and find the best movie showtime.
Return ONLY a raw JSON object (no markdown, no code blocks) with this exact schema:
{
  "recommended_show": { "day": "Saturday", "time": "Evening (4PM-8PM)" },
  "attendance": 2,
  "total_people": 2,
  "compromise_score": 0,
  "reason": "All participants are available on Saturday evening.",
  "alternative_slots": [
    { "day": "Sunday", "time": "Evening (4PM-8PM)", "attendance": 2, "compromise_score": 5, "reason": "All available but slightly less preferred." }
  ]
}

Rules:
1. Maximize attendance (priority 1).
2. Minimize compromise_score (priority 2).
3. Respect strict preferences (avoid late night if set).
4. Recommend day+time combos that EXIST in participants' preferred days/slots.
5. Do NOT use markdown or code blocks. Return only the JSON object.

Movie: ${JSON.stringify(movieDetails)}
Participants: ${JSON.stringify(participants)}
Preferences: ${JSON.stringify(preferences)}`;
}

// Try Gemini API first, then fallback to DeepSeek
async function tryGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API Error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function tryDeepSeek(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API Error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseContent(content: string): DeepSeekResponse {
  // Strip markdown code blocks if present
  const clean = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract the first JSON object in the response
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in AI response.');

  try {
    return JSON.parse(match[0]) as DeepSeekResponse;
  } catch {
    throw new Error('Failed to parse AI response as JSON. Raw: ' + clean.slice(0, 200));
  }
}

export async function analyzeAvailability(
  apiKey: string,
  movieDetails: MovieDetails,
  participants: Participant[],
  preferences: Preferences
): Promise<DeepSeekResponse> {
  if (!apiKey) {
    throw new Error('API key is missing. Please enter your Gemini or DeepSeek API key in Settings.');
  }

  const prompt = buildPrompt(movieDetails, participants, preferences);

  // Try Gemini first (starts with "AIza"), then DeepSeek (starts with "sk-")
  let content = '';
  if (apiKey.startsWith('AIza')) {
    content = await tryGemini(apiKey, prompt);
  } else if (apiKey.startsWith('sk-')) {
    content = await tryDeepSeek(apiKey, prompt);
  } else {
    // Try Gemini first, fallback to DeepSeek
    try {
      content = await tryGemini(apiKey, prompt);
    } catch {
      content = await tryDeepSeek(apiKey, prompt);
    }
  }

  return parseContent(content);
}
