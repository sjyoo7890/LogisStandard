import { z } from 'zod';

/**
 * 프로토콜 에러 코드 정의
 */
export enum ProtocolErrorCode {
  // 공통 에러 (E0xxx)
  UNKNOWN_ERROR = 'E0000',
  INVALID_MESSAGE_FORMAT = 'E0001',
  INVALID_HEADER = 'E0002',
  INVALID_PAYLOAD = 'E0003',
  VERSION_MISMATCH = 'E0004',
  CHECKSUM_ERROR = 'E0005',
  TIMEOUT = 'E0006',
  CONNECTION_REFUSED = 'E0007',
  AUTHENTICATION_FAILED = 'E0008',

  // 상위단 에러 (E1xxx)
  DB2DB_SYNC_FAILED = 'E1001',
  DB2DB_CONNECTION_LOST = 'E1002',
  DB2DB_SCHEMA_MISMATCH = 'E1003',
  FTP_TRANSFER_FAILED = 'E1101',
  FTP_FILE_NOT_FOUND = 'E1102',
  FTP_PARSE_ERROR = 'E1103',
  SIMS_UNREACHABLE = 'E1201',
  KPLAS_UNREACHABLE = 'E1202',
  FALLBACK_ACTIVATED = 'E1301',
  FALLBACK_CSV_WRITE_ERROR = 'E1302',

  // 하위단 에러 (E2xxx)
  PLC_CONNECTION_LOST = 'E2001',
  PLC_COMMAND_REJECTED = 'E2002',
  PLC_RESPONSE_TIMEOUT = 'E2003',
  IPS_READ_FAILURE = 'E2101',
  IPS_NO_READ = 'E2102',
  OCR_RECOGNITION_FAILED = 'E2201',
  OCR_LOW_CONFIDENCE = 'E2202',
  SCADA_DATA_ERROR = 'E2301',
  DISPLAY_UPDATE_FAILED = 'E2401',
  CONVEYOR_JAM = 'E2501',
  CONVEYOR_EMERGENCY_STOP = 'E2502',
}

/**
 * 에러 심각도
 */
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

/**
 * 프로토콜 에러 정보
 */
export interface ProtocolError {
  code: ProtocolErrorCode;
  severity: ErrorSeverity;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  source: string;
}

export const ProtocolErrorSchema = z.object({
  code: z.nativeEnum(ProtocolErrorCode),
  severity: z.nativeEnum(ErrorSeverity),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
  source: z.string(),
});

/**
 * 프로토콜 에러 생성 유틸리티
 */
export function createProtocolError(
  code: ProtocolErrorCode,
  severity: ErrorSeverity,
  message: string,
  source: string,
  details?: Record<string, unknown>,
): ProtocolError {
  return {
    code,
    severity,
    message,
    details,
    timestamp: new Date().toISOString(),
    source,
  };
}
