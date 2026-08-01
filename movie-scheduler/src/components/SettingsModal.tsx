import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Key, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { apiKey, setApiKey } = useAppStore();
  const [tempKey, setTempKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    setApiKey(tempKey.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 bg-zinc-950/50">
              <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                <Key size={16} className="text-zinc-400" /> API Settings
              </h2>
              <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <label className="block text-sm font-medium text-zinc-200 mb-1">AI API Key (Gemini or DeepSeek)</label>
              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Paste your <span className="text-blue-400 font-medium">Google Gemini API key</span> (starts with <code className="bg-zinc-800 px-1 rounded">AIza...</code>) or a <span className="text-purple-400 font-medium">DeepSeek API key</span> (starts with <code className="bg-zinc-800 px-1 rounded">sk-...</code>). Get a free Gemini key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">aistudio.google.com</a>.
              </p>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 pr-12 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm placeholder:text-zinc-600"
                  placeholder="AIza... (Gemini) or sk-... (DeepSeek)"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {tempKey && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  ✓ API key configured
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
