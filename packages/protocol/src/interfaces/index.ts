import { EquipmentType, EquipmentStatus } from '@kpost/common';

/**
 * 표준 인터페이스 메시지 헤더
 */
export interface StandardMessageHeader {
  messageId: string;         // 메시지 고유 ID
  messageType: MessageType;  // 메시지 유형
  sourceId: string;          // 송신자 ID
  targetId: string;          // 수신자 ID
  timestamp: string;         // 전송 시각 (ISO 8601)
  version: string;           // 프로토콜 버전
}

/**
 * 표준 인터페이스 메시지
 */
export interface StandardMessage<T = unknown> {
  header: StandardMessageHeader;
  payload: T;
}

/**
 * 메시지 유형
 */
export enum MessageType {
  // 설비 제어
  EQUIPMENT_STATUS = 'EQUIPMENT_STATUS',
  EQUIPMENT_COMMAND = 'EQUIPMENT_COMMAND',
  EQUIPMENT_RESPONSE = 'EQUIPMENT_RESPONSE',

  // 분류 작업
  SORT_PLAN = 'SORT_PLAN',
  SORT_RESULT = 'SORT_RESULT',
  SORT_STATISTICS = 'SORT_STATISTICS',

  // 시스템
  HEARTBEAT = 'HEARTBEAT',
  ERROR_REPORT = 'ERROR_REPORT',
  CONFIG_UPDATE = 'CONFIG_UPDATE',

  // 파일 전송
  FILE_TRANSFER_REQUEST = 'FILE_TRANSFER_REQUEST',
  FILE_TRANSFER_RESPONSE = 'FILE_TRANSFER_RESPONSE',
}

/**
 * 설비 상태 보고 페이로드
 */
export interface EquipmentStatusPayload {
  equipmentType: EquipmentType;
  equipmentId: string;
  status: EquipmentStatus;
  postOfficeCode: string;
  details?: Record<string, unknown>;
}

/**
 * 분류 결과 페이로드
 */
export interface SortResultPayload {
  jobId: string;
  equipmentId: string;
  barcode: string;
  sortCode: string;
  destinationChute: number;
  result: 'SUCCESS' | 'REJECT' | 'NO_READ' | 'NO_MATCH';
  processedAt: string;
}

/**
 * 하트비트 페이로드
 */
export interface HeartbeatPayload {
  equipmentId: string;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
}
