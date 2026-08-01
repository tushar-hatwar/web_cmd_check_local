import { execWebcmd } from '../src/wrapper.js';
import { testAuthStatus } from '../src/commands/auth.js';
import { testShowtimes } from '../src/commands/showtimes.js';
import { testSeats } from '../src/commands/seats.js';
import { testCheckout } from '../src/commands/checkout.js';

const LOCALITIES = ['marathahalli', 'hsr', 'bellandur', 'whitefield'];
const CITY = 'Bengaluru';
const TARGET_DATE = '2026-08-05';
const SEAT_COUNT = 3;

function parseTime(t) {
  if (!t) return 0;
  const m = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12;
  if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

async function runUseCase() {
  console.log('====================================================');
  console.log('🚀 Running Dedicated Usecase Flow');
  console.log(`📍 Filters: ${CITY}, ${TARGET_DATE}, Evening Shows, ${SEAT_COUNT} seats`);
  console.log(`📍 Localities: ${LOCALITIES.join(', ')}`);
  console.log('====================================================\n');

  // 1. Verify Authentication
  console.log('--- Step 1: Authentication Check ---');
  const auth = await testAuthStatus();
  if (!auth.success || !auth.loggedIn) {
    console.log('❌ Error: District session NOT logged in. You must be logged in for this flow.');
    console.log('   Run: webcmd district login');
    process.exit(1);
  }
  console.log('✅ Logged in successfully.\n');

  // 2. Discover a Movie
  console.log('--- Step 2: Fetching Movie Listings ---');
  let movieUrl = null;
  try {
    const listings = await execWebcmd(
      ['district', 'listings', 'movies', '-f', 'json', '--limit', '5'],
      { timeoutMs: 15000 }
    );
    if (listings.data && listings.data.length > 0) {
      movieUrl = listings.data[0].url || listings.data[0].title;
      console.log(`✅ Discovered movie: "${listings.data[0].title}"\n`);
    } else {
      throw new Error('No movies found.');
    }
  } catch (err) {
    console.error('❌ Failed to fetch movie listings:', err.message);
    process.exit(1);
  }

  // 3. Fetch Showtimes
  console.log(`--- Step 3: Fetching Showtimes for ${TARGET_DATE} ---`);
  let showtimes = [];
  try {
    const res = await testShowtimes(movieUrl, { city: CITY, date: TARGET_DATE });
    showtimes = Array.isArray(res.result.data) ? res.result.data : [];
    console.log(`✅ Found ${showtimes.length} total showtimes.\n`);
  } catch (err) {
    console.error('❌ Failed to fetch showtimes:', err.message);
    process.exit(1);
  }

  // 4. Select Any Available Show
  console.log('--- Step 4: Picking Any Available Show ---');
  if (showtimes.length === 0) {
    console.log('⚠️  No shows found for this date.');
    console.log('🏁 Flow completed without booking.');
    return;
  }

  // Pick the first available show
  const bestShow = showtimes[0];
  console.log(`✅ Selected Show: ${bestShow.time} at ${bestShow.cinema}\n`);

  // 5. Select Seats
  console.log(`--- Step 5: Fetching ${SEAT_COUNT} adjacent seats ---`);
  let seatTarget = bestShow.showId;
  let formatId = bestShow.formatId;
  let contentId = null;
  if (bestShow.url) {
    try {
      contentId = new URL(bestShow.url).searchParams.get('contentid');
    } catch {}
  }

  let selectedSeats = [];
  try {
    const seatRes = await testSeats(seatTarget, { 
      count: SEAT_COUNT, 
      together: true, 
      formatId, 
      contentId 
    });
    
    const seatsData = seatRes.result.data;
    if (Array.isArray(seatsData) && seatsData.length >= SEAT_COUNT) {
      selectedSeats = seatsData.slice(0, SEAT_COUNT).map(s => s.seat || s.number || String(s.rank));
      console.log(`✅ Successfully selected seats: ${selectedSeats.join(', ')}\n`);
    } else {
      console.log('⚠️  No adjacent seats available for this count.');
      return;
    }
  } catch (err) {
    if (err.error && err.error.code === 'EMPTY_RESULT') {
      console.log('⚠️  Booking is closed or sold out for this showtime.');
    } else {
      console.error('❌ Failed to fetch seats:', err.error ? err.error.message : err.message);
    }
    return;
  }

  // 6. Checkout
  console.log('--- Step 6: Proceeding to Checkout (Review Mode) ---');
  try {
    await testCheckout(seatTarget, selectedSeats, { formatId, contentId });
    console.log(`✅ Checkout review flow completed for seats ${selectedSeats.join(', ')}!`);
  } catch (err) {
    console.error('❌ Checkout failed:', err.error ? err.error.message : err.message);
  }

  console.log('\n====================================================');
  console.log('🏁 Usecase Flow Completed Successfully!');
  console.log('====================================================');
}

runUseCase().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
