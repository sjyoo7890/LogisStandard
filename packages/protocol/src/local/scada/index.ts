import { z } from 'zod';

/**
 * SCADA 상태 모니터링 프로토콜
 * 설비 전체 상태를 실시간 수집/표시
 */

export interface SCADAData {
  equipmentId: string;
  timestamp: string;
  systemStatus: SystemStatus;
  performanceData: PerformanceData;
  environmentData: EnvironmentData;
  alarms: SCADAAlarm[];
}

export enum SystemStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  FAULT = 'FAULT',
  EMERGENCY = 'EMERGENCY',
  OFFLINE = 'OFFLINE',
}

export interface PerformanceData {
  throughput: number;           // 시간당 처리량
  currentSpeed: number;         // 현재 속도 (m/min)
  targetSpeed: number;          // 목표 속도 (m/min)
  utilization: number;          // 가동률 (%)
  errorRate: number;            // 에러율 (%)
  totalProcessed: number;       // 총 처리 건수
  totalRejected: number;        // 총 리젝트 건수
}

export interface EnvironmentData {
  temperature: number;          // 장비 온도 (°C)
  humidity: number;             // 습도 (%)
  vibration: number;            // 진동 레벨
  powerConsumption: number;     // 전력 소비 (kW)
  noiseLevel: number;           // 소음 레벨 (dB)
}

export interface SCADAAlarm {
  alarmId: string;
  alarmCode: string;
  category: AlarmCategory;
  severity: AlarmSeverity;
  message: string;
  zone: string;                 // 발생 구역
  active: boolean;
  acknowledged: boolean;
  occurredAt: string;
  acknowledgedAt?: string;
  clearedAt?: string;
}

export enum AlarmCategory {
  MECHANICAL = 'MECHANICAL',
  ELECTRICAL = 'ELECTRICAL',
  SENSOR = 'SENSOR',
  COMMUNICATION = 'COMMUNICATION',
  SAFETY = 'SAFETY',
  PROCESS = 'PROCESS',
}

export enum AlarmSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export const SCADADataSchema = z.object({
  equipmentId: z.string(),
  timestamp: z.string().datetime(),
  systemStatus: z.nativeEnum(SystemStatus),
  performanceData: z.object({
    throughput: z.number().nonnegative(),
    currentSpeed: z.number().nonnegative(),
    targetSpeed: z.number().nonnegative(),
    utilization: z.number().min(0).max(100),
    errorRate: z.number().min(0).max(100),
    totalProcessed: z.number().int().nonnegative(),
    totalRejected: z.number().int().nonnegative(),
  }),
  environmentData: z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
    vibration: z.number().nonnegative(),
    powerConsumption: z.number().nonnegative(),
    noiseLevel: z.number().nonnegative(),
  }),
  alarms: z.array(z.object({
    alarmId: z.string(),
    alarmCode: z.string(),
    category: z.nativeEnum(AlarmCategory),
    severity: z.nativeEnum(AlarmSeverity),
    message: z.string(),
    zone: z.string(),
    active: z.boolean(),
    acknowledged: z.boolean(),
    occurredAt: z.string().datetime(),
    acknowledgedAt: z.string().datetime().optional(),
    clearedAt: z.string().datetime().optional(),
  })),
});
