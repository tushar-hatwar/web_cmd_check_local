import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Participant } from '../store/useAppStore';
import { Plus, X, Trash2, Edit2, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Morning (9AM–12PM)', 'Afternoon (12PM–4PM)', 'Evening (4PM–8PM)', 'Night (8PM–12AM)'];
const PRIORITIES = ['High', 'Medium', 'Low'] as const;

export function ParticipantManager() {
  const { participants, addParticipant, removeParticipant, updateParticipant } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const toggleItem = (arr: string[], item: string, setter: (a: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateParticipant(editingId, { name: name.trim(), preferredDays: selectedDays, preferredTimeSlots: selectedSlots, priority });
    } else {
      addParticipant({ id: crypto.randomUUID(), name: name.trim(), preferredDays: selectedDays, preferredTimeSlots: selectedSlots, priority });
    }
    resetForm();
  };

  const resetForm = () => {
    setName(''); setSelectedDays([]); setSelectedSlots([]); setPriority('Medium');
    setIsAdding(false); setEditingId(null);
  };

  const editParticipant = (p: Participant) => {
    setName(p.name); setSelectedDays(p.preferredDays); setSelectedSlots(p.preferredTimeSlots);
    setPriority(p.priority || 'Medium'); setEditingId(p.id); setIsAdding(true);
  };

  const priorityColor: Record<string, string> = {
    High: 'text-red-400 bg-red-400/10 border-red-400/30',
    Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    Low: 'text-green-400 bg-green-400/10 border-green-400/30',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-blue-500"></div>
          <h2 className="text-lg font-semibold text-zinc-100">Group Members</h2>
          {participants.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full border border-zinc-700">
              {participants.length} added
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-md shadow-blue-500/20"
          >
            <Plus size={16} /> Add Person
          </button>
        )}
      </div>

      {participants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {participants.map((p) => (
            <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative group hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                  <h3 className="font-semibold text-zinc-100">{p.name}</h3>
                </div>
                {p.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[p.priority]}`}>{p.priority}</span>
                )}
              </div>
              {p.preferredDays.length > 0 && (
                <p className="text-xs text-zinc-500 mb-1">
                  <span className="text-zinc-400">Days: </span>{p.preferredDays.join(', ')}
                </p>
              )}
              {p.preferredTimeSlots.length > 0 && (
                <p className="text-xs text-zinc-500">
                  <span className="text-zinc-400">Times: </span>{p.preferredTimeSlots.join(', ')}
                </p>
              )}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editParticipant(p)} className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors rounded-md hover:bg-zinc-800">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => removeParticipant(p.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-md hover:bg-zinc-800">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-zinc-100">{editingId ? 'Edit Person' : 'New Participant'}</h3>
            <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-800 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Name</label>
              <input
                type="text"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 text-sm"
                placeholder="Participant name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleItem(selectedDays, day, setSelectedDays)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedDays.includes(day)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Preferred Times</label>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleItem(selectedSlots, slot, setSelectedSlots)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedSlots.includes(slot)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2 font-medium">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      priority === p
                        ? priorityColor[p] + ' font-semibold'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={resetForm} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                {editingId ? 'Save Changes' : 'Add to Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {participants.length === 0 && !isAdding && (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
          <User size={28} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-zinc-500 text-sm">No participants yet. Click "Add Person" to start.</p>
        </div>
      )}
    </div>
  );
}
