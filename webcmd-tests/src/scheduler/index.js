/**
 * src/scheduler/index.js
 * Re-exports all scheduler functions for easy import.
 */

export { collectParticipantPreferences, normalizeParticipant, parseTimeRange, dayNameToDate } from './preferences.js';
export {
  computeAvailabilityMatrix,
  findFullOverlap,
  maximizeAttendance,
  calculateCompromiseScore,
  rankShowtimeOptions,
  isParticipantAvailable,
} from './availability.js';
export { generateExplanation, presentAlternatives } from './explainer.js';
