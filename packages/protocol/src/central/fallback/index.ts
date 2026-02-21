import { z } from 'zod';

/**
 * SIMS 장애 시 CSV Fallback 메커니즘
 * Post-Net에 직접 등록할 수 있는 대체 방식
 */

export enum FallbackStatus {
  INACTIVE = 'INACTIVE',      // 정상 운영 (Fallback 비활성)
  ACTIVATED = 'ACTIVATED',    // Fallback 활성화
  RECOVERING = 'RECOVERING',  // 복구 중 (적재 데이터 전송)
  COMPLETED = 'COMPLETED',    // 복구 완료
}

export interface FallbackState {
  status: FallbackStatus;
  activatedAt?: string;
  reason?: string;
  pendingRecords: number;     // 미전송 레코드 수
  csvFilesGenerated: number;  // 생성된 CSV 파일 수
  lastCsvFile?: string;
}

/**
 * CSV 파일 형식 정의
 */
export interface CSVExportConfig {
  delimiter: string;          // 구분자 (기본: ',')
  encoding: string;           // 인코딩 (기본: 'UTF-8')
  includeHeader: boolean;     // 헤더 포함 여부
  maxRowsPerFile: number;     // 파일당 최대 행 수
  outputDir: string;          // 출력 디렉토리
  fileNamePattern: string;    // 파일명 패턴 (예: 'sorting_result_{date}_{seq}.csv')
}

export const DEFAULT_CSV_CONFIG: CSVExportConfig = {
  delimiter: ',',
  encoding: 'UTF-8',
  includeHeader: true,
  maxRowsPerFile: 10000,
  outputDir: './fallback',
  fileNamePattern: 'fallback_{type}_{date}_{seq}.csv',
};

// CSV 내보내기용 구분결과 레코드
export interface CSVSortingResultRecord {
  barcode: string;
  sortCode: string;
  destinationChute: number;
  result: string;
  processedAt: string;
  equipmentId: string;
  postOfficeCode: string;
}

export const CSVSortingResultRecordSchema = z.object({
  barcode: z.string(),
  sortCode: z.string(),
  destinationChute: z.number().int(),
  result: z.string(),
  processedAt: z.string(),
  equipmentId: z.string(),
  postOfficeCode: z.string(),
});

// CSV 내보내기용 체결정보 레코드
export interface CSVBindingRecord {
  barcode: string;
  containerNumber: string;
  destinationCode: string;
  bindingType: string;
  confirmedAt: string;
  operatorId: string;
  postOfficeCode: string;
}

// Fallback 이벤트 로그
export interface FallbackEvent {
  eventId: string;
  eventType: FallbackEventType;
  timestamp: string;
  details: string;
  csvFileName?: string;
  recordCount?: number;
}

export enum FallbackEventType {
  SIMS_DOWN_DETECTED = 'SIMS_DOWN_DETECTED',
  FALLBACK_ACTIVATED = 'FALLBACK_ACTIVATED',
  CSV_FILE_CREATED = 'CSV_FILE_CREATED',
  SIMS_RECOVERED = 'SIMS_RECOVERED',
  RECOVERY_STARTED = 'RECOVERY_STARTED',
  RECOVERY_PROGRESS = 'RECOVERY_PROGRESS',
  RECOVERY_COMPLETED = 'RECOVERY_COMPLETED',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
}

/**
 * SIMS 연결 상태 체크 설정
 */
export interface SIMSHealthCheckConfig {
  checkIntervalMs: number;     // 체크 간격 (ms)
  timeoutMs: number;           // 타임아웃 (ms)
  failureThreshold: number;    // 장애 판단 임계값 (연속 실패 횟수)
  recoveryThreshold: number;   // 복구 판단 임계값 (연속 성공 횟수)
}

export const DEFAULT_SIMS_HEALTH_CONFIG: SIMSHealthCheckConfig = {
  checkIntervalMs: 10000,
  timeoutMs: 5000,
  failureThreshold: 3,
  recoveryThreshold: 5,
};
