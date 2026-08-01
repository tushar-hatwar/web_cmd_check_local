/**
 * preferences.js
 * Defines and validates participant preference schema.
 * Parses time ranges like "18:00-22:00" into {start, end} minute values.
 * Maps day names to target dates relative to a base date.
 */

/**
 * Parse a "HH:MM" string into total minutes from midnight.
 * @param {string} t - e.g. "18:30"
 * @returns {number}
 */
export function parseHHMM(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Parse a time range string like "18:00-22:00" into {start, end} minutes.
 * @param {string} range
 * @returns {{ start: number, end: number }}
 */
export function parseTimeRange(range) {
  const [startStr, endStr] = range.split('-');
  return { start: parseHHMM(startStr.trim()), end: parseHHMM(endStr.trim()) };
}

/**
 * Map a day name (e.g. "Friday") to a YYYY-MM-DD date string
 * within the next 7 days from today.
 * @param {string} dayName
 * @returns {string|null}
 */
export function dayNameToDate(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = days.indexOf(dayName.toLowerCase());
  if (target === -1) return null;
  const today = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === target) {
      return d.toISOString().split('T')[0];
    }
  }
  return null;
}

/**
 * Validate and normalize a raw participant preference object.
 * @param {object} raw
 * @returns {{ name: string, availability: Record<string, {start:number,end:number}[]>, preferredTheatres: string[], preferredFormat: string, preferredLanguage: string }}
 */
export function normalizeParticipant(raw) {
  const availability = {};
  for (const [day, ranges] of Object.entries(raw.availability || {})) {
    availability[day] = (Array.isArray(ranges) ? ranges : [ranges]).map(parseTimeRange);
  }
  return {
    name: raw.name || 'Unknown',
    availability,
    preferredTheatres: raw.preferredTheatres || [],
    preferredFormat: (raw.preferredFormat || '').toLowerCase(),
    preferredLanguage: (raw.preferredLanguage || '').toLowerCase(),
  };
}

/**
 * Normalize an array of raw participants.
 * @param {object[]} rawList
 * @returns {object[]}
 */
export function collectParticipantPreferences(rawList) {
  return rawList.map(normalizeParticipant);
}
