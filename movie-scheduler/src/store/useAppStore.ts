import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Participant {
  id: string;
  name: string;
  preferredDays: string[];
  preferredTimeSlots: string[];
  priority?: 'High' | 'Medium' | 'Low';
}

export interface MovieDetails {
  name: string;
  city: string;
  theatre?: string;
  language: string;
  format: string;
  ticketCount: number;
}

export interface Preferences {
  maxBudget?: number;
  preferredTheatreChain?: string;
  avoidLateNight: boolean;
  preferWeekend: boolean;
  preferEvening: boolean;
  flexibleTimings: boolean;
}

interface AppState {
  apiKey: string;
  movieDetails: MovieDetails;
  participants: Participant[];
  preferences: Preferences;

  // Actions
  setApiKey: (key: string) => void;
  updateMovieDetails: (details: Partial<MovieDetails>) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      movieDetails: {
        name: '',
        city: '',
        theatre: '',
        language: 'English',
        format: '2D',
        ticketCount: 1,
      },
      participants: [],
      preferences: {
        avoidLateNight: false,
        preferWeekend: false,
        preferEvening: false,
        flexibleTimings: true,
      },

      setApiKey: (key) => set({ apiKey: key }),
      
      updateMovieDetails: (details) => 
        set((state) => ({ movieDetails: { ...state.movieDetails, ...details } })),
        
      addParticipant: (participant) =>
        set((state) => ({ participants: [...state.participants, participant] })),
        
      updateParticipant: (id, updates) =>
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
        
      removeParticipant: (id) =>
        set((state) => ({
          participants: state.participants.filter((p) => p.id !== id),
        })),
        
      updatePreferences: (prefs) =>
        set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
    }),
    {
      name: 'movie-scheduler-storage',
    }
  )
);
