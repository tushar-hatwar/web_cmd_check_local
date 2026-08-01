import { useState } from 'react';
import { Film, Key } from 'lucide-react';
import { MovieForm } from './components/MovieForm';
import { ParticipantManager } from './components/ParticipantManager';
import { PreferencePanel } from './components/PreferencePanel';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { SettingsModal } from './components/SettingsModal';
import { useAppStore } from './store/useAppStore';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { apiKey } = useAppStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center ring-1 ring-blue-500/30">
              <Film size={15} />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">CineGroup</span>
            <span className="hidden sm:inline text-zinc-600 text-xs">AI Movie Scheduler</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              apiKey
                ? 'text-green-400 bg-green-400/10 border border-green-400/20 hover:border-green-400/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
            title="Configure API key"
          >
            <Key size={13} />
            {apiKey ? 'API Connected' : 'Setup API Key'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Powered by DeepSeek AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 mb-3">
          Plan your group movie,{' '}
          <span className="text-blue-400">without the chaos.</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Collect everyone's availability, let AI find the best showtime that works for the most people, and book with a single click.
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <MovieForm />
        <ParticipantManager />
        <PreferencePanel />
        <AIAnalysisPanel />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center">
        <p className="text-zinc-600 text-xs">
          CineGroup • AI-Powered Group Movie Scheduler • Built with React + DeepSeek
        </p>
      </footer>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
