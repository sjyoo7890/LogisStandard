import { z } from 'zod';

/**
 * Change Data Capture (CDC) 메커니즘
 * DB2DB 동기화를 위한 변경감지
 */

export enum CDCOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface CDCEvent<T = unknown> {
  eventId: string;
  tableName: string;
  operation: CDCOperation;
  timestamp: string;
  sequenceNo: number;
  before?: T;         // UPDATE/DELETE 시 변경 전 데이터
  after?: T;          // INSERT/UPDATE 시 변경 후 데이터
  primaryKey: Record<string, string | number>;
  source: string;     // 원본 DB 식별자
}

export const CDCEventSchema = z.object({
  eventId: z.string().min(1),
  tableName: z.string().min(1),
  operation: z.nativeEnum(CDCOperation),
  timestamp: z.string().datetime(),
  sequenceNo: z.number().int().nonnegative(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  primaryKey: z.record(z.union([z.string(), z.number()])),
  source: z.string(),
});

/**
 * CDC 체크포인트 - 마지막 동기화 위치 추적
 */
export interface CDCCheckpoint {
  tableName: string;
  lastSequenceNo: number;
  lastTimestamp: string;
  lastEventId: string;
  syncedAt: string;
}

export const CDCCheckpointSchema = z.object({
  tableName: z.string(),
  lastSequenceNo: z.number().int(),
  lastTimestamp: z.string().datetime(),
  lastEventId: z.string(),
  syncedAt: z.string().datetime(),
});

/**
 * CDC 동기화 상태
 */
export enum CDCSyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
}

export interface CDCSyncState {
  status: CDCSyncStatus;
  checkpoints: CDCCheckpoint[];
  pendingEvents: number;
  lastError?: string;
  startedAt?: string;
}

/**
 * CDC 배치 처리 설정
 */
export interface CDCBatchConfig {
  batchSize: number;            // 한 번에 처리할 이벤트 수
  pollIntervalMs: number;       // 폴링 간격 (ms)
  retryAttempts: number;        // 재시도 횟수
  retryDelayMs: number;         // 재시도 대기 (ms)
  maxLagMs: number;             // 최대 허용 지연 (ms)
}

export const DEFAULT_CDC_CONFIG: CDCBatchConfig = {
  batchSize: 100,
  pollIntervalMs: 1000,
  retryAttempts: 3,
  retryDelayMs: 5000,
  maxLagMs: 60000,
};
