import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ParsedPaper, ScreenedPaper, ScreeningProgress, SessionMeta } from '../types';

export interface SessionHistory {
  id: string;
  date: string;
  thesis: string;
  results: ScreenedPaper[];
  stats: {
    included: number;
    maybe: number;
    excluded: number;
  };
}

interface ScreeningState {
  thesis: string;
  selectedModel: string;
  parsedPapers: ParsedPaper[];
  selectedPaperIds: Set<string>;
  screeningResults: ScreenedPaper[];
  screeningStatus: "idle" | "running" | "done" | "aborted";
  progress: ScreeningProgress;
  notes: Record<string, string>;
  starred: Set<string>;
  sessionMeta: SessionMeta;
  history: SessionHistory[];
  
  // Actions
  setThesis: (thesis: string) => void;
  setSelectedModel: (model: string) => void;
  setParsedPapers: (papers: ParsedPaper[]) => void;
  togglePaperSelection: (id: string) => void;
  selectAllPapers: () => void;
  deselectAllPapers: () => void;
  startScreening: () => void;
  abortScreening: () => void;
  updateProgress: (done: number, total: number) => void;
  addScreeningResults: (results: ScreenedPaper[]) => void;
  finishScreening: (durationMs: number) => void;
  setNote: (id: string, note: string) => void;
  toggleStar: (id: string) => void;
  resetSession: () => void;
  saveToHistory: () => void;
  loadFromHistory: (id: string) => void;
}

export const useScreeningStore = create<ScreeningState>()(
  persist(
    (set, get) => ({
      thesis: '',
      selectedModel: '',
      parsedPapers: [],
      selectedPaperIds: new Set(),
      screeningResults: [],
      screeningStatus: 'idle',
      progress: { done: 0, total: 0 },
      notes: {},
      starred: new Set(),
      sessionMeta: { durationMs: 0, startedAt: '' },
      history: [],

      setThesis: (thesis) => set({ thesis }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setParsedPapers: (papers) => set({ 
        parsedPapers: papers,
        selectedPaperIds: new Set(papers.map(p => p.id))
      }),
      togglePaperSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedPaperIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { selectedPaperIds: newSet };
      }),
      selectAllPapers: () => set((state) => ({
        selectedPaperIds: new Set(state.parsedPapers.map(p => p.id))
      })),
      deselectAllPapers: () => set({ selectedPaperIds: new Set() }),
      startScreening: () => set({ 
        screeningStatus: 'running', 
        screeningResults: [], 
        progress: { done: 0, total: get().selectedPaperIds.size },
        sessionMeta: { durationMs: 0, startedAt: new Date().toISOString() }
      }),
      abortScreening: () => set({ screeningStatus: 'aborted' }),
      updateProgress: (done, total) => set({ progress: { done, total } }),
      addScreeningResults: (results) => set((state) => ({
        screeningResults: [...state.screeningResults, ...results]
      })),
      finishScreening: (durationMs) => {
        set((state) => ({
          screeningStatus: 'done',
          sessionMeta: { ...state.sessionMeta, durationMs }
        }));
        get().saveToHistory();
      },
      setNote: (id, note) => set((state) => ({
        notes: { ...state.notes, [id]: note }
      })),
      toggleStar: (id) => set((state) => {
        const newSet = new Set(state.starred);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { starred: newSet };
      }),
      resetSession: () => set({
        thesis: '',
        parsedPapers: [],
        selectedPaperIds: new Set(),
        screeningResults: [],
        screeningStatus: 'idle',
        progress: { done: 0, total: 0 },
        notes: {},
        starred: new Set(),
        sessionMeta: { durationMs: 0, startedAt: '' }
      }),
      saveToHistory: () => set((state) => {
        const newHistoryItem: SessionHistory = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          thesis: state.thesis,
          results: state.screeningResults,
          stats: {
            included: state.screeningResults.filter(p => p.decision === 'INCLUDE').length,
            maybe: state.screeningResults.filter(p => p.decision === 'MAYBE').length,
            excluded: state.screeningResults.filter(p => p.decision === 'EXCLUDE').length,
          }
        };
        const newHistory = [newHistoryItem, ...state.history].slice(0, 5);
        return { history: newHistory };
      }),
      loadFromHistory: (id) => set((state) => {
        const item = state.history.find(h => h.id === id);
        if (!item) return state;
        return {
          thesis: item.thesis,
          screeningResults: item.results,
          screeningStatus: 'done',
          parsedPapers: item.results, // Rehydrate parsed papers from results
          selectedPaperIds: new Set(item.results.map(p => p.id)),
          progress: { done: item.results.length, total: item.results.length },
          sessionMeta: { durationMs: 0, startedAt: item.date }
        };
      })
    }),
    {
      name: 'litscreen-storage',
      partialize: (state) => ({
        thesis: state.thesis,
        notes: state.notes,
        starred: Array.from(state.starred),
        screeningResults: state.screeningResults,
        sessionMeta: state.sessionMeta,
        selectedModel: state.selectedModel,
        history: state.history
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        starred: new Set(persistedState.starred || [])
      })
    }
  )
);
