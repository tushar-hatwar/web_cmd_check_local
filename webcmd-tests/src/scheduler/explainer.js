/**
 * explainer.js
 * Generates human-readable explanations and presents ranked alternatives.
 */

const COMPROMISE_LABELS = [
  { max: 0,  label: 'None' },
  { max: 20, label: 'Low' },
  { max: 50, label: 'Medium' },
  { max: 80, label: 'High' },
  { max: Infinity, label: 'Very High' },
];

function compromiseLabel(score) {
  return COMPROMISE_LABELS.find(c => score <= c.max)?.label || 'Very High';
}

/**
 * Generate a human-readable explanation for the top recommendation.
 * @param {object[]} rankedOptions - sorted matrix entries
 * @param {number} totalParticipants
 * @returns {string}
 */
export function generateExplanation(rankedOptions, totalParticipants) {
  if (rankedOptions.length === 0) return 'No showtimes available for any participant.';

  const top = rankedOptions[0];
  const show = top.showtime;
  const allPresent = top.count === totalParticipants;

  const lines = [];

  if (allPresent) {
    lines.push(`✅ A showtime works for all ${totalParticipants} participants!`);
  } else {
    lines.push(`ℹ️  No showtime fits all ${totalParticipants} participants.`);
    lines.push(`   Best option accommodates ${top.count} out of ${totalParticipants}.`);
  }

  lines.push('');
  lines.push(`📽️  Recommended: ${show.date} at ${show.time}`);
  lines.push(`   🎬 ${show.movie || 'Movie'}`);
  lines.push(`   🏛️  ${show.cinema}`);
  lines.push(`   🎞️  ${show.format} | ${show.language}`);
  lines.push(`   💰 ${show.priceRange || 'N/A'}`);

  if (top.available.length > 0) {
    lines.push('');
    lines.push(`   ✅ Available: ${top.available.join(', ')}`);
  }
  if (top.unavailable.length > 0) {
    lines.push(`   ❌ Unavailable: ${top.unavailable.join(', ')}`);
  }

  lines.push('');
  lines.push(`   Compromise score: ${top.totalCompromise} (${compromiseLabel(top.totalCompromise)})`);

  return lines.join('\n');
}

/**
 * Present the top N alternatives in a formatted list.
 * @param {object[]} rankedOptions
 * @param {number} totalParticipants
 * @param {number} [topN=3]
 * @returns {string}
 */
export function presentAlternatives(rankedOptions, totalParticipants, topN = 3) {
  const options = rankedOptions.slice(0, topN);
  const lines = ['\n📋 Top Showtime Options:\n'];

  options.forEach((entry, i) => {
    const show = entry.showtime;
    lines.push(`Option ${i + 1}`);
    lines.push(`  ${show.date} at ${show.time} — ${show.cinema}`);
    lines.push(`  Format: ${show.format} | ${show.language} | ${show.priceRange || 'N/A'}`);
    lines.push(`  Attendance: ${entry.count}/${totalParticipants}`);
    lines.push(`  Compromise: ${compromiseLabel(entry.totalCompromise)} (score: ${entry.totalCompromise})`);
    if (entry.unavailable.length > 0) {
      lines.push(`  ❌ Unavailable: ${entry.unavailable.join(', ')}`);
    } else {
      lines.push(`  ✅ All participants available`);
    }
    lines.push('-'.repeat(50));
  });

  return lines.join('\n');
}
