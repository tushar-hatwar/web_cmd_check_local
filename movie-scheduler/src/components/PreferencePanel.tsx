import { useAppStore } from '../store/useAppStore';
import { Moon, Calendar, Clock, Settings2, DollarSign } from 'lucide-react';

export function PreferencePanel() {
  const { preferences, updatePreferences } = useAppStore();

  const Toggle = ({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: () => void; icon: React.ReactNode }) => (
    <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer group transition-all">
      <div className="flex items-center gap-3">
        <div className="text-zinc-500 group-hover:text-blue-400 transition-colors">{icon}</div>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>
      <div
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-6 rounded-full bg-blue-500"></div>
        <h2 className="text-lg font-semibold text-zinc-100">Group Preferences</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Toggle label="Avoid Late Night Shows" checked={preferences.avoidLateNight} onChange={() => updatePreferences({ avoidLateNight: !preferences.avoidLateNight })} icon={<Moon size={16} />} />
        <Toggle label="Prefer Weekends" checked={preferences.preferWeekend} onChange={() => updatePreferences({ preferWeekend: !preferences.preferWeekend })} icon={<Calendar size={16} />} />
        <Toggle label="Prefer Evening Shows" checked={preferences.preferEvening} onChange={() => updatePreferences({ preferEvening: !preferences.preferEvening })} icon={<Clock size={16} />} />
        <Toggle label="Flexible Timings (±2 hrs)" checked={preferences.flexibleTimings} onChange={() => updatePreferences({ flexibleTimings: !preferences.flexibleTimings })} icon={<Settings2 size={16} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5 font-medium flex items-center gap-1.5">
            <DollarSign size={14} /> Max Budget per Ticket (₹)
          </label>
          <input
            type="number"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 text-sm"
            placeholder="e.g. 500"
            value={preferences.maxBudget ?? ''}
            onChange={(e) => updatePreferences({ maxBudget: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Preferred Theatre Chain</label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 text-sm"
            placeholder="e.g. PVR, INOX, Cinepolis"
            value={preferences.preferredTheatreChain ?? ''}
            onChange={(e) => updatePreferences({ preferredTheatreChain: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
}
