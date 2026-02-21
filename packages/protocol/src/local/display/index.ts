import { z } from 'zod';

/**
 * 현황판 프로토콜
 * - 슈트현황판 (Profile A: 소포/대형통상구분기)
 * - 구분칸현황판 (Profile B: 소형통상/집배순로구분기)
 * - 상황관제현황판 (Profile A)
 * - 작업현황판/OP패널 (Profile B)
 */

export enum DisplayType {
  CHUTE_DISPLAY = 'CHUTE_DISPLAY',           // 슈트현황판 (Profile A)
  BIN_DISPLAY = 'BIN_DISPLAY',               // 구분칸현황판 (Profile B)
  CONTROL_DISPLAY = 'CONTROL_DISPLAY',       // 상황관제현황판 (Profile A)
  WORK_DISPLAY = 'WORK_DISPLAY',             // 작업현황판/OP패널 (Profile B)
}

// 슈트현황판 데이터 (Profile A)
export interface ChuteDisplayData {
  displayId: string;
  equipmentId: string;
  chutes: ChuteInfo[];
  updatedAt: string;
}

export interface ChuteInfo {
  chuteNumber: number;
  destinationCode: string;
  destinationName: string;
  currentCount: number;        // 현재 물량
  maxCapacity: number;         // 최대 용량
  fullRate: number;            // 적재율 (%)
  status: 'NORMAL' | 'NEAR_FULL' | 'FULL' | 'ERROR' | 'DISABLED';
  containerNumber?: string;    // 배정된 용기번호
  lastItemAt?: string;         // 마지막 물건 도착 시각
}

// 구분칸현황판 데이터 (Profile B)
export interface BinDisplayData {
  displayId: string;
  equipmentId: string;
  bins: BinInfo[];
  updatedAt: string;
}

export interface BinInfo {
  binNumber: number;           // 구분칸 번호
  routeCode: string;           // 순로코드
  officeName: string;          // 배달국명
  currentCount: number;        // 현재 물량
  boxAttached: boolean;        // 상자 부착 여부
  status: 'NORMAL' | 'NEAR_FULL' | 'FULL' | 'NO_BOX' | 'ERROR';
}

// 상황관제현황판 데이터 (Profile A)
export interface ControlDisplayData {
  displayId: string;
  equipmentId: string;
  equipmentStatus: string;
  runningTime: number;         // 가동시간 (분)
  totalProcessed: number;      // 총 처리건수
  throughput: number;           // 시간당 처리량
  successRate: number;          // 구분 성공률 (%)
  rejectRate: number;           // 리젝트율 (%)
  topDestinations: DestinationSummary[];  // 상위 목적지별 물량
  recentAlarms: string[];       // 최근 알람 목록
  updatedAt: string;
}

export interface DestinationSummary {
  destinationCode: string;
  destinationName: string;
  count: number;
  percentage: number;
}

// 작업현황판/OP패널 데이터 (Profile B)
export interface WorkDisplayData {
  displayId: string;
  equipmentId: string;
  jobId: string;
  jobStatus: string;
  planName: string;            // 구분계획명
  startTime: string;
  totalPlanned: number;        // 계획 물량
  totalProcessed: number;      // 처리 물량
  successCount: number;
  rejectCount: number;
  noReadCount: number;
  progressRate: number;        // 진행률 (%)
  estimatedEndTime?: string;   // 예상 완료 시간
  operators: OperatorInfo[];   // 작업자 목록
  updatedAt: string;
}

export interface OperatorInfo {
  operatorId: string;
  name: string;
  position: string;            // 투입 위치
  processedCount: number;      // 처리 건수
}

// 현황판 업데이트 메시지
export interface DisplayUpdateMessage {
  displayType: DisplayType;
  data: ChuteDisplayData | BinDisplayData | ControlDisplayData | WorkDisplayData;
  refreshIntervalMs: number;
}

export const ChuteDisplayDataSchema = z.object({
  displayId: z.string(),
  equipmentId: z.string(),
  chutes: z.array(z.object({
    chuteNumber: z.number().int(),
    destinationCode: z.string(),
    destinationName: z.string(),
    currentCount: z.number().int().nonnegative(),
    maxCapacity: z.number().int().positive(),
    fullRate: z.number().min(0).max(100),
    status: z.enum(['NORMAL', 'NEAR_FULL', 'FULL', 'ERROR', 'DISABLED']),
    containerNumber: z.string().optional(),
    lastItemAt: z.string().optional(),
  })),
  updatedAt: z.string().datetime(),
});
