import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Film, Tag, Users2, Ticket,
  Loader2, AlertTriangle, Check
} from 'lucide-react';
import { fetchShowtimes, fetchSeats, initiateCheckout } from '../api/webcmd';
import type { Showtime, SeatInfo } from '../api/webcmd';

interface Props {
  activeSlot: { day: string, time: string };
  movie: string;
  city: string;
  language: string;
  ticketCount: number;
  onExhausted?: () => void;
  onNextSlot?: () => void;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function dayNameToDate(dayName: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Check if it's "Today" or "Tomorrow" shorthands
  const lower = dayName.toLowerCase();
  if (lower === 'today') return todayStr;
  if (lower === 'tomorrow') {
    const t = new Date(today);
    t.setDate(today.getDate() + 1);
    return t.toISOString().split('T')[0];
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = days.findIndex(d => d.toLowerCase() === lower.split(' ')[0].toLowerCase());
  if (target === -1) return todayStr;

  const todayDay = today.getDay();
  let diff = (target - todayDay + 7) % 7;

  // If diff is 0, it means today — use today
  // If diff is 7 (same weekday next week), prefer today (diff=0)
  // District only opens booking 1-3 days ahead, so never go more than 3 days out
  if (diff === 0) diff = 0;   // Today
  else if (diff > 3) diff = 0; // Too far ahead → fall back to today

  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function extractContentId(url: string): string | undefined {
  try { return new URL(url).searchParams.get('contentid') ?? undefined; } catch { return undefined; }
}

function isWithinAIWindow(showtime: Showtime, aiTime: string): boolean {
  const toMins = (t: string) => {
    const clean = t.replace(/\s?(am|pm)/i, '').trim();
    const [h, m] = clean.split(':').map(Number);
    const isPM = /pm/i.test(t);
    return ((h % 12) + (isPM ? 12 : 0)) * 60 + (m || 0);
  };
  const diff = Math.abs(toMins(showtime.time) - toMins(aiTime));
  return diff <= 180; // within 3 hours of AI recommendation
}

// ──────────────────────────────────────────────────────────────
// Sub-component: ShowtimeCard
// ──────────────────────────────────────────────────────────────
function ShowtimeCard({
  show, ticketCount, autoFetch, onBook, onResult
}: {
  show: Showtime;
  ticketCount: number;
  autoFetch: boolean;
  onBook: (seats: string[]) => void;
  onResult?: (hasSeats: boolean) => void;
}) {
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'done'>('idle');
  const hasNotifiedRef = useRef(false);

  const notifyResult = (found: boolean) => {
    if (!hasNotifiedRef.current && onResult) {
      hasNotifiedRef.current = true;
      onResult(found);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBestSeats();
    }
  }, [autoFetch, show.showId]);

  const fetchBestSeats = async () => {
    if (seats.length > 0 || seatsLoading) return;
    setSeatsLoading(true);
    setSeatsError(null);
    let foundSeats = false;
    try {
      const contentId = extractContentId(show.url);
      const res = await fetchSeats({
        showId: show.showId,
        formatId: show.formatId,
        contentId,
        count: ticketCount,
        together: false, // Adjacent seats are no longer a preference
      });
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setSeats(res.data.slice(0, ticketCount));
        foundSeats = true;
      } else if (res.ok) {
        setSeatsError('No available seats found.');
      } else {
        // Here, res.ok is false, meaning webcmd CLI returned an error
        let errorMsg = res.error || 'Failed to fetch seats.';
        if (errorMsg.includes('error:') && errorMsg.includes('message:')) {
           const match = errorMsg.match(/message:\s*'(.*?)'/);
           if (match) errorMsg = match[1];
           else {
             const unquotedMatch = errorMsg.match(/message:\s*(.*?)(?=\n|$)/);
             if (unquotedMatch) errorMsg = unquotedMatch[1].trim();
           }
        }
        setSeatsError(errorMsg);
      }
    } catch (e: any) {
      setSeatsError(e.message || 'Failed to fetch seats.');
    } finally {
      setSeatsLoading(false);
      // Notify using the local flag to avoid stale state closures
      notifyResult(foundSeats);
    }
  };

  const handleBook = async () => {
    if (seats.length === 0) return;
    setBookingStatus('booking');
    try {
      const seatIds = seats.map(s => s.seat || String(s.rank));
      await onBook(seatIds);
      setBookingStatus('done'); // Server fires checkout in background, respond immediately
    } catch {
      // Even on error, show done — checkout may have launched
      setBookingStatus('done');
    }
  };

  const formatBadgeColor = (fmt: string) => {
    if (fmt.includes('IMAX')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (fmt.includes('4DX')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (fmt.includes('3D')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/50';
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col sm:flex-row">
      <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-zinc-800/50">
        <div className="flex flex-col h-full justify-between gap-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-zinc-100 font-semibold">
                <Clock size={15} className="text-zinc-500" />
                {show.time}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md">
                <Tag size={12} />
                {show.priceRange}
              </div>
            </div>
            <div className="flex items-start gap-2 mb-3">
              <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0" />
              <span className="text-sm font-medium text-zinc-300 leading-tight">{show.cinema}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${formatBadgeColor(show.format)}`}>
                {show.format}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border bg-zinc-800/60 text-zinc-400 border-zinc-700/50">
                {show.language}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sm:w-64 p-4 flex flex-col justify-center bg-zinc-900/20">
        {seatsLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 py-2">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium animate-pulse">Finding best seats...</span>
          </div>
        ) : seatsError ? (
          <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
              <AlertTriangle size={14} />
              {seatsError.includes('page.evaluate') || seatsError.includes('context was destroyed') || seatsError.includes('closed')
                ? 'Booking Closed for this show'
                : seatsError}
            </div>
            <button onClick={fetchBestSeats} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">Retry</button>
          </div>
        ) : seats.length > 0 ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-medium text-green-400">
              <Check size={14} /> {seats.length} seat{seats.length > 1 ? 's' : ''} available!
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mb-1">
              {seats.map((s, i) => (
                <div key={i} className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-md text-[11px] font-mono text-green-400 font-semibold" title={s.category}>
                  {s.seat || `S${i + 1}`}
                </div>
              ))}
            </div>
            <button
              onClick={handleBook}
              disabled={bookingStatus === 'booking' || bookingStatus === 'done'}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                bookingStatus === 'done'
                  ? 'bg-zinc-800 text-green-400 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
              }`}
            >
              {bookingStatus === 'booking' ? (
                <><Loader2 size={14} className="animate-spin" /> Wait...</>
              ) : bookingStatus === 'done' ? (
                '🌐 Browser Opened ✓'
              ) : (
                <><Ticket size={15} /> Book Tickets</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <button
              onClick={fetchBestSeats}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors border border-zinc-700"
            >
              Check Availability
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main component: ShowtimesPanel
// ──────────────────────────────────────────────────────────────
export function ShowtimesPanel({ activeSlot, movie, city, language, ticketCount, onExhausted, onNextSlot }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [allShowtimes, setAllShowtimes] = useState<Showtime[]>([]);
  const [filteredShowtimes, setFilteredShowtimes] = useState<Showtime[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const [completedCount, setCompletedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    setCompletedCount(0);
    setSuccessCount(0);
  }, [activeSlot.day, activeSlot.time]);

  const handleCardResult = useCallback((hasSeats: boolean) => {
    setCompletedCount(c => c + 1);
    if (hasSeats) setSuccessCount(s => s + 1);
  }, []);

  const handleFetch = async () => {
    setStatus('loading');
    setError(null);
    setAllShowtimes([]);
    setFilteredShowtimes([]);

    const date = dayNameToDate(activeSlot.day);
    try {
      const res = await fetchShowtimes({ movie, city, date, language });
      if (!res.ok || !Array.isArray(res.data)) {
        throw new Error((res as any).error || 'Failed to fetch showtimes. Is the proxy server running?');
      }

      const all = res.data as Showtime[];
      setAllShowtimes(all);

      // Pre-filter: shows within ±3hrs of AI recommendation and have available seats
      const availableAll = all.filter(s => s.available === undefined || s.available > 0);
      const nearby = availableAll.filter(s => isWithinAIWindow(s, activeSlot.time));
      const filtered = nearby.length > 0 ? nearby : availableAll.slice(0, 10);
      setFilteredShowtimes(filtered);
      setStatus('done');

      if (filtered.length === 0 && onExhausted) {
        setTimeout(() => onExhausted(), 1500);
      }
    } catch (e: any) {
      let errorMsg = e.message || 'Unknown error.';
      if (errorMsg.includes('error:') && errorMsg.includes('message:')) {
         const match = errorMsg.match(/message:\s*'(.*?)'/);
         if (match) errorMsg = match[1];
         else {
           const unquotedMatch = errorMsg.match(/message:\s*(.*?)(?=\n|$)/);
           if (unquotedMatch) errorMsg = unquotedMatch[1].trim();
         }
      }
      setError(errorMsg);
      setStatus('error');
      
      if (onExhausted) {
        setTimeout(() => onExhausted(), 1500);
      }
    }
  };

  // Re-fetch automatically when activeSlot changes
  useEffect(() => {
    handleFetch();
  }, [activeSlot.day, activeSlot.time]);

  const handleBook = async (showId: string, seatIds: string[], formatId: string, url: string) => {
    const contentId = extractContentId(url);
    await initiateCheckout({ showId, seats: seatIds, formatId, contentId });
  };

  const displayedShowtimes = showAll ? allShowtimes : filteredShowtimes;
  const isAllUnavailable = !showAll && status === 'done' && filteredShowtimes.length > 0 && completedCount === filteredShowtimes.length && successCount === 0;

  return (
    <div id="live-showtimes-panel" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-green-500"></div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Film size={18} className="text-green-400" />
            Live Showtimes
          </h2>
          {status === 'done' && (
            <span className="text-xs px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
              {allShowtimes.length} shows found
            </span>
          )}
        </div>

        {status === 'idle' && (
          <button
            onClick={handleFetch}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-green-500/20"
          >
            <Film size={15} /> Fetch Showtimes
          </button>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Checking: <span className="text-zinc-200 font-medium ml-1">{activeSlot.day} · {activeSlot.time}</span>
            </span>
            <button
              onClick={handleFetch}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
            >
              <Loader2 size={12} /> Refresh
            </button>
          </div>
        )}
      </div>

      {/* Context banner from AI */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg px-4 py-3 mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Clock size={13} className="text-blue-400" />
          Target Time: <span className="text-zinc-200 font-medium ml-1">{activeSlot.day} · {activeSlot.time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <MapPin size={13} className="text-blue-400" />
          <span className="text-zinc-200 font-medium">{city}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Users2 size={13} className="text-blue-400" />
          <span className="text-zinc-200 font-medium">{ticketCount}</span> tickets
        </div>
      </div>

      {/* Status: Loading */}
      {status === 'loading' && (
        <div className="py-14 flex flex-col items-center text-zinc-500">
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 border-3 border-green-500/20 rounded-full" />
            <div className="absolute inset-0 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm animate-pulse">Fetching real showtimes via webcmd...</p>
        </div>
      )}

      {/* Status: Error */}
      {status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium mb-1">Failed to fetch showtimes</p>
            <p className="text-xs text-red-400/70">{error}</p>
            <p className="text-xs text-red-400/50 mt-2">Make sure the proxy server is running: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-red-300">npm run server</code></p>
          </div>
        </div>
      )}

      {/* Alert when all auto-fetched showtimes are sold out or closed */}
      {isAllUnavailable && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-5 rounded-xl text-center my-4 space-y-3">
          <div className="flex items-center justify-center gap-2 font-semibold text-sm sm:text-base">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            No Available Seats for {activeSlot.day} ({activeSlot.time})
          </div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            We checked {filteredShowtimes.length} showtimes near this time, but booking is currently closed or sold out on District.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {onNextSlot && (
              <button
                onClick={onNextSlot}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
              >
                Check Next Alternative Slot →
              </button>
            )}
            <button
              onClick={() => setShowAll(true)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-all border border-zinc-700"
            >
              Show All {allShowtimes.length} Shows (See Status)
            </button>
          </div>
        </div>
      )}

      {/* Status: Done */}
      {status === 'done' && displayedShowtimes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {displayedShowtimes.map((show) => (
            <ShowtimeCard
              key={show.showId + show.cinema}
              show={show}
              ticketCount={ticketCount}
              autoFetch={!showAll} // Only auto-fetch the filtered short list
              onBook={(seatIds) => handleBook(show.showId, seatIds, show.formatId, show.url)}
              onResult={handleCardResult}
            />
          ))}

          {/* Toggle: show all */}
          {allShowtimes.length > filteredShowtimes.length && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="w-full mt-2 py-2.5 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all"
            >
              {showAll
                ? `Show fewer (near AI time)`
                : `Show all ${allShowtimes.length} showtimes`}
            </button>
          )}
        </motion.div>
      )}

      {status === 'done' && displayedShowtimes.length === 0 && (
        <div className="text-center py-10 text-zinc-500 text-sm">
          <Film size={28} className="mx-auto text-zinc-700 mb-2" />
          No showtimes found for {movie} in {city}.
        </div>
      )}

      {status === 'idle' && (
        <div className="border border-dashed border-zinc-800 rounded-xl py-10 text-center">
          <Film size={28} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-zinc-500 text-sm">Click <span className="text-green-400 font-medium">Fetch Showtimes</span> to search for real shows</p>
          <p className="text-zinc-600 text-xs mt-1">Powered by webcmd → District API</p>
        </div>
      )}
    </div>
  );
}
