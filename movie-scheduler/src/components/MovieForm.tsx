import { useAppStore } from '../store/useAppStore';

export function MovieForm() {
  const { movieDetails, updateMovieDetails } = useAppStore();

  const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 text-sm";
  const labelClass = "block text-sm text-zinc-400 mb-1.5 font-medium";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-6 rounded-full bg-blue-500"></div>
        <h2 className="text-lg font-semibold text-zinc-100">Movie Details</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Movie Name</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Spider-Man: Brand New Day"
            value={movieDetails.name}
            onChange={(e) => updateMovieDetails({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Bengaluru"
            value={movieDetails.city}
            onChange={(e) => updateMovieDetails({ city: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Preferred Theatre (Optional)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. PVR Nexus"
            value={movieDetails.theatre}
            onChange={(e) => updateMovieDetails({ theatre: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Language</label>
          <select
            className={inputClass}
            value={movieDetails.language}
            onChange={(e) => updateMovieDetails({ language: e.target.value })}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Telugu</option>
            <option>Tamil</option>
            <option>Kannada</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Format</label>
          <select
            className={inputClass}
            value={movieDetails.format}
            onChange={(e) => updateMovieDetails({ format: e.target.value })}
          >
            <option>2D</option>
            <option>3D</option>
            <option>IMAX</option>
            <option>4DX</option>
            <option>IMAX 3D</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Number of Tickets</label>
          <input
            type="number"
            min="1"
            max="20"
            className={inputClass}
            value={movieDetails.ticketCount}
            onChange={(e) => updateMovieDetails({ ticketCount: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>
    </div>
  );
}
