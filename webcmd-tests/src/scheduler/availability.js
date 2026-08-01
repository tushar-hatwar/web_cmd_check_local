/**
 * availability.js
 * Core scheduling algorithm:
 *  - computeAvailabilityMatrix
 *  - findFullOverlap
 *  - maximizeAttendance
 *  - calculateCompromiseScore
 *  - rankShowtimeOptions
 */

import { parseHHMM } from './preferences.js';

// Approximate movie duration in minutes (used to check if show ends within availability)
const MOVIE_DURATION_MINS = 150;

/**
 * Parse showtime time string like "07:00 pm" into minutes from midnight.
 * @param {string} t
 * @returns {number}
 */
function parseShowTime(t) {
  if (!t) return 0;
  const m = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12;
  if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

/**
 * Get the day name for a YYYY-MM-DD date string.
 * @param {string} dateStr
 * @returns {string} e.g. "Friday"
 */
function dateToDayName(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

/**
 * Check if a participant is available for a given showtime.
 * @param {object} participant
 * @param {object} showtime - { date, time, cinema, format, language }
 * @returns {boolean}
 */
export function isParticipantAvailable(participant, showtime) {
  const dayName = dateToDayName(showtime.date);
  const windows = participant.availability[dayName];
  if (!windows || windows.length === 0) return false;

  const showStart = parseShowTime(showtime.time);
  const showEnd = showStart + MOVIE_DURATION_MINS;

  return windows.some(w => showStart >= w.start && showEnd <= w.end);
}

/**
 * Build a matrix: for each showtime, which participants can attend.
 * @param {object[]} participants
 * @param {object[]} showtimes
 * @returns {{ showtime: object, available: string[], unavailable: string[], count: number }[]}
 */
export function computeAvailabilityMatrix(participants, showtimes) {
  return showtimes.map(show => {
    const available = [];
    const unavailable = [];
    for (const p of participants) {
      if (isParticipantAvailable(p, show)) {
        available.push(p.name);
      } else {
        unavailable.push(p.name);
      }
    }
    return { showtime: show, available, unavailable, count: available.length };
  });
}

/**
 * Priority 1: Find shows where ALL participants are available.
 * @param {object[]} matrix
 * @returns {object[]}
 */
export function findFullOverlap(matrix) {
  return matrix.filter(entry => entry.unavailable.length === 0);
}

/**
 * Priority 2: Group shows by attendance count (descending).
 * Returns the shows with the highest attendance.
 * @param {object[]} matrix
 * @returns {object[]}
 */
export function maximizeAttendance(matrix) {
  const maxCount = Math.max(...matrix.map(e => e.count));
  return matrix.filter(e => e.count === maxCount);
}

/**
 * Calculate compromise score for a single participant attending a showtime.
 * Higher score = more compromise.
 * @param {object} participant
 * @param {object} showtime
 * @returns {number}
 */
export function calculateCompromiseScore(participant, showtime) {
  let score = 0;
  const dayName = dateToDayName(showtime.date);
  const showStart = parseShowTime(showtime.time);
  const showEnd = showStart + MOVIE_DURATION_MINS;

  const windows = participant.availability[dayName];
  if (!windows || windows.length === 0) {
    // Not available at all — maximum penalty
    return 100;
  }

  // Check if show falls within any window
  const fits = windows.some(w => showStart >= w.start && showEnd <= w.end);
  if (!fits) {
    // Partially out of window
    const closest = windows[0];
    if (showStart < closest.start) score += 10; // arrives earlier than preferred
    if (showEnd > closest.end) score += 15;     // stays later than preferred
  }

  // Wrong theatre penalty
  if (participant.preferredTheatres.length > 0) {
    const cinemaLower = (showtime.cinema || '').toLowerCase();
    const matchesTheatre = participant.preferredTheatres.some(t =>
      cinemaLower.includes(t.toLowerCase())
    );
    if (!matchesTheatre) score += 20;
  }

  // Wrong format penalty
  if (participant.preferredFormat) {
    const fmtLower = (showtime.format || '').toLowerCase();
    if (!fmtLower.includes(participant.preferredFormat)) score += 10;
  }

  // Wrong language penalty
  if (participant.preferredLanguage) {
    const langLower = (showtime.language || '').toLowerCase();
    if (!langLower.includes(participant.preferredLanguage)) score += 8;
  }

  return score;
}

/**
 * Rank all showtime options by:
 * 1. Attendance (desc)
 * 2. Total compromise score (asc)
 * 3. Show time (asc)
 *
 * @param {object[]} matrix
 * @param {object[]} participants
 * @returns {object[]} sorted matrix entries with added `totalCompromise` field
 */
export function rankShowtimeOptions(matrix, participants) {
  const scored = matrix.map(entry => {
    const totalCompromise = participants.reduce((sum, p) => {
      return sum + calculateCompromiseScore(p, entry.showtime);
    }, 0);
    return { ...entry, totalCompromise };
  });

  return scored.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;           // more attendance first
    if (a.totalCompromise !== b.totalCompromise)
      return a.totalCompromise - b.totalCompromise;               // less compromise first
    return parseShowTime(a.showtime.time) - parseShowTime(b.showtime.time); // earlier show first
  });
}
