/**
 * test/group-booking.js
 * Interactive group booking flow for 4-5 participants.
 *
 * Usage: node test/group-booking.js
 *
 * Edit PARTICIPANTS below to define your group's preferences.
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

import { execWebcmd } from '../src/wrapper.js';
import { testAuthStatus } from '../src/commands/auth.js';
import { testShowtimes } from '../src/commands/showtimes.js';
import { testSeats } from '../src/commands/seats.js';
import { testCheckout } from '../src/commands/checkout.js';

import {
  collectParticipantPreferences,
  dayNameToDate,
  computeAvailabilityMatrix,
  findFullOverlap,
  maximizeAttendance,
  rankShowtimeOptions,
  generateExplanation,
  presentAlternatives,
} from '../src/scheduler/index.js';

// ─────────────────────────────────────────────────────────────
// CONFIGURE YOUR GROUP HERE
// ─────────────────────────────────────────────────────────────
const RAW_PARTICIPANTS = [
  {
    name: 'Alice',
    preferredTheatres: ['Cinepolis', 'PVR'],
    preferredFormat: '3D',
    preferredLanguage: 'English',
    availability: {
      Wednesday: ['17:00-23:00'],
      Friday:    ['18:00-23:00'],
    },
  },
  {
    name: 'Bob',
    preferredTheatres: [],
    preferredFormat: '',
    preferredLanguage: 'English',
    availability: {
      Wednesday: ['19:00-23:00'],
      Saturday:  ['11:00-20:00'],
    },
  },
  {
    name: 'Charlie',
    preferredTheatres: ['IMAX'],
    preferredFormat: 'IMAX',
    preferredLanguage: '',
    availability: {
      Wednesday: ['14:00-22:00'],
      Friday:    ['20:00-23:00'],
    },
  },
  {
    name: 'David',
    preferredTheatres: [],
    preferredFormat: '2D',
    preferredLanguage: '',
    availability: {
      Wednesday: ['17:00-23:00'],
      Sunday:    ['12:00-18:00'],
    },
  },
  {
    name: 'Eva',
    preferredTheatres: ['PVR', 'INOX'],
    preferredFormat: '',
    preferredLanguage: 'Hindi',
    availability: {
      Thursday:  ['18:00-23:00'],
      Saturday:  ['16:00-23:00'],
    },
  },
];

const CITY = 'Bengaluru';

// ─────────────────────────────────────────────────────────────

async function promptUser(question) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function fetchShowtimesForDays(movieUrl, days) {
  const allShowtimes = [];
  for (const day of days) {
    const date = dayNameToDate(day);
    if (!date) continue;
    try {
      const res = await testShowtimes(movieUrl, { city: CITY, date });
      if (Array.isArray(res.result.data)) {
        allShowtimes.push(...res.result.data);
      }
      console.log(`  ✅ ${day} (${date}): ${res.result.data?.length || 0} shows`);
    } catch {
      console.log(`  ⚠️  ${day} (${date}): fetch failed`);
    }
  }
  return allShowtimes;
}

async function main() {
  console.log('====================================================');
  console.log('🎬 Group Movie Booking Scheduler');
  console.log('====================================================\n');

  // 1. Authenticate
  console.log('--- Step 1: Authentication ---');
  const auth = await testAuthStatus();
  if (!auth.success || !auth.loggedIn) {
    console.error('❌ Not logged in. Run: $env:WEBCMD_WINDOW="foreground"; webcmd district login');
    process.exit(1);
  }
  console.log('✅ Logged in.\n');

  // 2. Normalize participants
  console.log('--- Step 2: Participant Preferences ---');
  const participants = collectParticipantPreferences(RAW_PARTICIPANTS);
  participants.forEach(p => {
    const days = Object.keys(p.availability).join(', ');
    console.log(`  👤 ${p.name} — available: ${days}`);
  });
  console.log();

  // 3. Fetch movie
  console.log('--- Step 3: Fetching Movie Listings ---');
  let movieUrl = null;
  let movieTitle = null;
  try {
    const listings = await execWebcmd(
      ['district', 'listings', 'movies', '-f', 'json', '--limit', '5'],
      { timeoutMs: 15000 }
    );
    if (listings.data?.length > 0) {
      movieUrl = listings.data[0].url || listings.data[0].title;
      movieTitle = listings.data[0].title;
      console.log(`✅ Movie: "${movieTitle}"\n`);
    } else throw new Error('No movies in listings.');
  } catch (err) {
    console.error('❌ Failed to fetch listings:', err.message);
    process.exit(1);
  }

  // 4. Collect unique days from all participants
  const allDays = [...new Set(participants.flatMap(p => Object.keys(p.availability)))];
  console.log(`--- Step 4: Fetching Showtimes for [${allDays.join(', ')}] ---`);
  const allShowtimes = await fetchShowtimesForDays(movieUrl, allDays);
  console.log(`\n   Total shows fetched: ${allShowtimes.length}\n`);

  if (allShowtimes.length === 0) {
    console.log('❌ No showtimes found for any of the requested days.');
    process.exit(1);
  }

  // 5. Run the scheduler
  console.log('--- Step 5: Running Scheduling Algorithm ---');
  const matrix = computeAvailabilityMatrix(participants, allShowtimes);
  const fullOverlap = findFullOverlap(matrix);
  const ranked = rankShowtimeOptions(matrix, participants);

  if (fullOverlap.length > 0) {
    console.log(`✅ Found ${fullOverlap.length} show(s) where ALL participants are available!\n`);
  } else {
    const best = maximizeAttendance(matrix);
    console.log(`ℹ️  No full overlap. Best attendance: ${best[0]?.count}/${participants.length}\n`);
  }

  // 6. Print explanation + alternatives
  console.log(generateExplanation(ranked, participants.length));
  console.log(presentAlternatives(ranked, participants.length, 3));

  // 7. Loop through options until we find one that is open for booking
  console.log('\n--- Step 6: Automatically Booking Best Available Option ---');
  const seatCount = 3;

  let successfulShow = null;
  let selectedSeats = [];

  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    const entry = ranked[i];
    const show = entry.showtime;
    let contentId = null;
    if (show.url) {
      try { contentId = new URL(show.url).searchParams.get('contentid'); } catch {}
    }

    console.log(`\n📌 Trying Option ${i + 1}: ${show.date} ${show.time} at ${show.cinema}`);
    console.log(`   Attempting to book ${seatCount} adjacent seats...`);
    
    try {
      const seatRes = await testSeats(show.showId, {
        count: seatCount,
        together: true,
        formatId: show.formatId,
        contentId,
      });
      const seatsData = seatRes.result.data;
      if (Array.isArray(seatsData) && seatsData.length > 0) {
        selectedSeats = seatsData.slice(0, seatCount).map(s => s.seat || s.number || String(s.rank));
        console.log(`✅ Adjacent seats selected: ${selectedSeats.join(', ')}`);
        successfulShow = { show, contentId };
        break;
      }
    } catch (err) {
      if (err.error?.code === 'COMMAND_EXEC' && err.error?.message?.toLowerCase().includes('booking is now closed')) {
        console.log('❌ Booking is closed for this show. Skipping to next option...');
        continue;
      }
      
      console.log(`⚠️  Failed to find ${seatCount} adjacent seats. Falling back to ANY available seats...`);
      try {
        const fbRes = await testSeats(show.showId, {
          count: seatCount,
          together: false,
          formatId: show.formatId,
          contentId,
        });
        const seatsData = fbRes.result.data;
        if (Array.isArray(seatsData) && seatsData.length > 0) {
          selectedSeats = seatsData.slice(0, seatCount).map(s => s.seat || s.number || String(s.rank));
          console.log(`✅ Fallback successful! Selected seats: ${selectedSeats.join(', ')}`);
          successfulShow = { show, contentId };
          break;
        }
      } catch (fbErr) {
        console.log('❌ Fallback failed. Skipping to next option...');
        continue;
      }
    }
  }

  if (!successfulShow) {
    console.error('\n❌ Exhausted top 10 options. All bookings are closed or sold out.');
    process.exit(1);
  }

  // 9. Checkout (review mode)
  console.log('\n--- Step 8: Proceeding to Checkout (Review Mode) ---');
  try {
    await testCheckout(successfulShow.show.showId, selectedSeats, {
      formatId: successfulShow.show.formatId,
      contentId: successfulShow.contentId,
    });
    console.log(`\n✅ Checkout review page opened for seats: ${selectedSeats.join(', ')}`);
    console.log('   Review the booking in the browser and click "Pay now" to confirm.');
  } catch (err) {
    console.error('❌ Checkout failed:', err.error?.message || err.message);
  }

  console.log('\n====================================================');
  console.log('🏁 Group Booking Flow Complete!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
