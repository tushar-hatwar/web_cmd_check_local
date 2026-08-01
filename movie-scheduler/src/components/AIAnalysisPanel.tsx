import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { analyzeAvailability } from '../api/deepseek';
import type { DeepSeekResponse } from '../api/deepseek';
import { ShowtimesPanel } from './ShowtimesPanel';
import { Sparkles, Calendar, Clock, Users, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AIAnalysisPanel() {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeepSeekResponse | null>(null);
  const [activeSlot, setActiveSlot] = useState<{ day: string; time: string } | null>(null);

  const handleAnalyze = async () => {
    if (!store.apiKey) {
      setError('Please configure your Gemini or DeepSeek API key in ⚙️ Settings first.');
      return;
    }
    if (!store.movieDetails.name) {
      setError('Please enter a movie name in the Movie Details section.');
      return;
    }
    if (store.participants.length === 0) {
      setError('Please add at least one participant in the Group Members section.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeAvailability(store.apiKey, store.movieDetails, store.participants, store.preferences);
      setResult(response);
      setActiveSlot(response.recommended_show);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTickets = () => {
    const el = document.getElementById('live-showtimes-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scoreColor = (score: number) => {
    if (score <= 10) return 'text-green-400';
    if (score <= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-yellow-500"></div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            AI Analysis
          </h2>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
            loading
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-yellow-300" />
              Analyze Availability
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-5 flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-16 flex flex-col items-center justify-center text-zinc-500"
          >
            <div className="relative w-16 h-16 mb-5">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <Sparkles size={18} className="absolute inset-0 m-auto text-blue-400" />
            </div>
            <p className="text-sm font-medium text-zinc-400 animate-pulse">DeepSeek is crunching everyone's availability...</p>
            <p className="text-xs text-zinc-600 mt-1">This may take a few seconds</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Main Recommendation */}
            <div className="bg-zinc-950 border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                <h3 className="font-semibold text-zinc-100">Top Recommendation</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: <Calendar size={13} />, label: 'Day', value: result.recommended_show.day },
                  { icon: <Clock size={13} />, label: 'Time', value: result.recommended_show.time },
                  { icon: <Users size={13} />, label: 'Attendance', value: `${result.attendance} / ${result.total_people}` },
                  { icon: <AlertTriangle size={13} />, label: 'Compromise', value: `${result.compromise_score} pts` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <div className="text-zinc-500 text-xs mb-1 flex items-center gap-1">{icon} {label}</div>
                    <div className={`font-semibold text-sm ${label === 'Compromise' ? scoreColor(result.compromise_score) : 'text-zinc-100'}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg p-4 mb-5">
                <p className="text-xs text-blue-400 font-semibold mb-1 uppercase tracking-wider">Why this slot?</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{result.reason}</p>
              </div>

              <button
                onClick={handleBookTickets}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2 hover:shadow-blue-500/30"
              >
                <Ticket size={18} /> Book {store.movieDetails.ticketCount} Ticket{store.movieDetails.ticketCount > 1 ? 's' : ''} Now
              </button>
            </div>
            
            <ShowtimesPanel
              activeSlot={activeSlot || result.recommended_show}
              movie={store.movieDetails.name}
              city={store.movieDetails.city}
              language={store.movieDetails.language}
              ticketCount={store.movieDetails.ticketCount}
              onNextSlot={() => {
                if (!result.alternative_slots) return;
                const currentSlot = activeSlot || result.recommended_show;
                const matchSlot = (a: { day: string; time: string }, b: { day: string; time: string }) => {
                  if (a.day.toLowerCase() !== b.day.toLowerCase()) return false;
                  const tA = a.time.toLowerCase().split(/[\s(]/)[0];
                  const tB = b.time.toLowerCase().split(/[\s(]/)[0];
                  return tA === tB;
                };
                const currentIdx = result.alternative_slots.findIndex(s => matchSlot(s, currentSlot));
                const nextIdx = currentIdx === -1 ? 0 : currentIdx + 1;
                if (nextIdx < result.alternative_slots.length) {
                   setActiveSlot(result.alternative_slots[nextIdx]);
                }
              }}
              onExhausted={() => {
                if (!result.alternative_slots) return;
                const currentSlot = activeSlot || result.recommended_show;
                const matchSlot = (a: { day: string; time: string }, b: { day: string; time: string }) => {
                  if (a.day.toLowerCase() !== b.day.toLowerCase()) return false;
                  const tA = a.time.toLowerCase().split(/[\s(]/)[0];
                  const tB = b.time.toLowerCase().split(/[\s(]/)[0];
                  return tA === tB;
                };
                const currentIdx = result.alternative_slots.findIndex(s => matchSlot(s, currentSlot));
                const nextIdx = currentIdx === -1 ? 0 : currentIdx + 1;
                if (nextIdx < result.alternative_slots.length) {
                   setActiveSlot(result.alternative_slots[nextIdx]);
                }
              }}
            />

            {/* Alternatives */}
            {result.alternative_slots && result.alternative_slots.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Alternative Options</p>
                <div className="space-y-2">
                  {result.alternative_slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex gap-5 shrink-0">
                        <div>
                          <div className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1"><Calendar size={11}/> When</div>
                          <div className="text-sm font-medium text-zinc-200">{slot.day}, {slot.time}</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1"><Users size={11}/> People</div>
                          <div className="text-sm font-medium text-zinc-200">{slot.attendance} / {result.total_people}</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1"><AlertTriangle size={11}/> Score</div>
                          <div className={`text-sm font-medium ${scoreColor(slot.compromise_score)}`}>{slot.compromise_score}</div>
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2 mt-3 md:mt-0">
                        <p className="text-sm text-zinc-500 md:text-right md:max-w-xs">{slot.reason}</p>
                        <button
                          onClick={() => {
                            setActiveSlot({ day: slot.day, time: slot.time });
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                          }}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 self-start md:self-end"
                        >
                          Check Showtimes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!loading && !result && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border border-dashed border-zinc-800 rounded-xl"
          >
            <Sparkles size={32} className="mx-auto text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm font-medium">Fill in the details above and click</p>
            <p className="text-blue-400 text-sm font-semibold mt-1">"Analyze Availability"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
