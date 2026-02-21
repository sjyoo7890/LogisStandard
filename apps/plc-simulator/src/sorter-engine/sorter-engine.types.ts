import { SorterStatus, InductionStatus, InductionMode, DischargeStatus } from '@kpost/telegram';

export interface SorterEngineConfig {
  inductionCount: number;
  chuteCount: number;
  inductionIntervalMs: number;
  errorProbability: number;
  sortSuccessRate: number;
  noReadRate: number;
  overflowThreshold: number;
  transitTimeMs: number;
  confirmDelayMs: number;
}

export const DEFAULT_ENGINE_CONFIG: SorterEngineConfig = {
  inductionCount: 2,
  chuteCount: 100,
  inductionIntervalMs: 1500,
  errorProbability: 0.02,
  sortSuccessRate: 0.95,
  noReadRate: 0.03,
  overflowThreshold: 50,
  transitTimeMs: 3000,
  confirmDelayMs: 500,
};

export interface VirtualSorter {
  status: SorterStatus;
  totalInducted: number;
  totalDischarged: number;
  totalConfirmed: number;
  totalErrors: number;
  totalNoRead: number;
  totalRecirculated: number;
  startedAt?: string;
}

export interface VirtualInduction {
  no: number;
  status: InductionStatus;
  mode: InductionMode;
  itemCount: number;
  lastPid?: number;
}

export interface VirtualChute {
  no: number;
  itemCount: number;
  overflow: boolean;
}

export interface VirtualItem {
  pid: number;
  cellIndex: number;
  inductionNo: number;
  mode: number;
  destination: number;
  inductedAt: string;
  dischargedAt?: string;
  status: 'IN_TRANSIT' | 'DISCHARGED' | 'CONFIRMED';
}

export { SorterStatus, InductionStatus, InductionMode, DischargeStatus };
