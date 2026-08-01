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

export async function analyzeAvailability(
  apiKey: string,
  movieDetails: MovieDetails,
  participants: Participant[],
  preferences: Preferences
): Promise<DeepSeekResponse> {
  if (!apiKey) {
    throw new Error('API key is missing. Please configure it in settings.');
  }

  const systemPrompt = `You are an AI scheduling assistant for group movie bookings.
Your task is to analyze everyone's availability and preferences, and find the best movie showtime.
Return ONLY a raw JSON response (no markdown, no code blocks) matching this exact schema:
{
  "recommended_show": { "day": "...", "time": "..." },
  "attendance": number,
  "total_people": number,
  "compromise_score": number,
  "reason": "...",
  "alternative_slots": [
    { "day": "...", "time": "...", "attendance": number, "compromise_score": number, "reason": "..." }
  ]
}

Rules for selecting:
1. Maximize attendance (this is priority 1).
2. Minimize compromise score (priority 2). Compromise includes wrong day, wrong time, wrong format, etc.
3. Respect strict preferences (like avoid late night).
4. Do NOT output markdown formatting like \`\`\`json. Just the JSON object.
`;

  const userPrompt = `
Movie Details: ${JSON.stringify(movieDetails, null, 2)}
Participants: ${JSON.stringify(participants, null, 2)}
Preferences: ${JSON.stringify(preferences, null, 2)}
  `;

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    // Sometimes LLMs still wrap in markdown despite instructions.
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent) as DeepSeekResponse;
  } catch (err) {
    throw new Error('Failed to parse AI response as JSON.');
  }
}
