/**
 * src/api/webcmd.ts
 * Client-side API layer that talks to the local proxy server (server.js).
 */

const BASE = 'http://localhost:3001/api';

export interface Showtime {
  rank: number;
  movie: string;
  language: string;
  date: string;
  time: string;
  cinema: string;
  format: string;
  priceRange: string;
  available: number;
  showId: string;
  formatId: string;
  url: string;
}

export interface SeatInfo {
  rank: number;
  seat: string;
  row: string;
  price: number;
  category: string;
}

async function post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ ok: boolean; loggedIn?: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    return { ok: true, loggedIn: data.ok && data.data?.ok !== false };
  } catch {
    return { ok: false, error: 'Proxy server not reachable. Run: npm run server' };
  }
}

export async function fetchShowtimes(params: {
  movie: string;
  city: string;
  date?: string;
  language?: string;
}): Promise<{ ok: boolean; data?: Showtime[]; error?: string }> {
  return post('/showtimes', params);
}

export async function fetchSeats(params: {
  showId: string;
  formatId?: string;
  contentId?: string;
  count?: number;
  together?: boolean;
}): Promise<{ ok: boolean; data?: SeatInfo[]; error?: string }> {
  return post('/seats', params);
}

export async function initiateCheckout(params: {
  showId: string;
  seats: string[];
  formatId?: string;
  contentId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  return post('/checkout', params);
}
