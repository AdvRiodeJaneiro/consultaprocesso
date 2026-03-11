import { create } from 'zustand';
import { EscavadorProcesso } from '../types';

interface SearchState {
  query: string;
  results: EscavadorProcesso[];
  lastSearchType: 'cnj' | 'involved' | null;
  setSearchData: (query: string, results: EscavadorProcesso[], type: 'cnj' | 'involved') => void;
  setResults: (results: EscavadorProcesso[]) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  lastSearchType: null,
  setSearchData: (query, results, type) => set({ query, results, lastSearchType: type }),
  setResults: (results) => set({ results }),
  clearSearch: () => set({ query: '', results: [], lastSearchType: null }),
}));