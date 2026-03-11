import { create } from 'zustand';
import { DebugLog } from '../components/DebugOverlay';

interface LogState {
  logs: DebugLog[];
  addLog: (message: string, type?: 'info' | 'error' | 'success', data?: any) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  addLog: (message, type = 'info', data) => set((state) => ({
    logs: [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        data
      },
      ...state.logs
    ].slice(0, 50) // Mantém apenas os últimos 50 logs para não pesar a memória
  })),
  clearLogs: () => set({ logs: [] }),
}));