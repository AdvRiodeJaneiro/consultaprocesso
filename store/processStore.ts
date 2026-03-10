import { create } from 'zustand';
import { MonitoredProcess } from '../hooks/useMyProcesses';

interface ProcessStore {
  myProcesses: MonitoredProcess[];
  hasLoadedOnce: boolean;
  setProcesses: (processes: MonitoredProcess[]) => void;
  addProcess: (process: MonitoredProcess) => void;
  removeProcess: (id: string) => void;
  setHasLoaded: (val: boolean) => void;
}

export const useProcessStore = create<ProcessStore>((set) => ({
  myProcesses: [],
  hasLoadedOnce: false,
  setProcesses: (processes) => set({ myProcesses: processes, hasLoadedOnce: true }),
  addProcess: (process) => set((state) => ({ 
    myProcesses: [process, ...state.myProcesses] 
  })),
  removeProcess: (id) => set((state) => ({ 
    myProcesses: state.myProcesses.filter(p => p.id !== id) 
  })),
  setHasLoaded: (val) => set({ hasLoadedOnce: val }),
}));