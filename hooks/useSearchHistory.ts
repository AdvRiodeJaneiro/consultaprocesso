import { useState, useEffect } from 'react';
import { EscavadorProcesso } from '../types';

export interface SearchEntry {
  query: string;
  results: EscavadorProcesso[];
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('search_history_v1');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addToHistory = (query: string, results: EscavadorProcesso[]) => {
    // Evitar duplicados na lista de tags
    const cleanQuery = query.trim();
    if (history.find(h => h.query.toLowerCase() === cleanQuery.toLowerCase())) {
        return;
    }

    const newEntry: SearchEntry = {
      query: cleanQuery,
      results,
      timestamp: Date.now()
    };

    const newHistory = [newEntry, ...history].slice(0, 10); // Manter as 10 últimas
    setHistory(newHistory);
    localStorage.setItem('search_history_v1', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history_v1');
  };

  return {
    history,
    addToHistory,
    clearHistory
  };
}