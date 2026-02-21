import { create } from 'zustand';

interface SystemState {
  wsConnected: boolean;
  alarmCount: number;
  systemStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  setWsConnected: (connected: boolean) => void;
  setAlarmCount: (count: number) => void;
  setSystemStatus: (status: 'NORMAL' | 'WARNING' | 'CRITICAL') => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  wsConnected: false,
  alarmCount: 3,
  systemStatus: 'NORMAL',
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setAlarmCount: (count) => set({ alarmCount: count }),
  setSystemStatus: (status) => set({ systemStatus: status }),
}));
