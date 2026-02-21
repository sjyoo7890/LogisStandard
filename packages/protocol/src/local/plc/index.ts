import { z } from 'zod';

/**
 * PLC 제어 전문 프로토콜
 * 구분관리시스템(SMC) ↔ PLC 간 TCP/IP 소켓통신
 */

// PLC 명령 타입
export enum PLCCommandType {
  // 설비 제어
  START = 'START',
  STOP = 'STOP',
  RESET = 'RESET',
  EMERGENCY_STOP = 'E_STOP',
  SPEED_CHANGE = 'SPEED',

  // 슈트 제어
  CHUTE_OPEN = 'CHUTE_OPEN',
  CHUTE_CLOSE = 'CHUTE_CLOSE',
  CHUTE_FULL_RESET = 'CHUTE_FULL_RESET',

  // 다이버터 제어
  DIVERTER_ON = 'DIV_ON',
  DIVERTER_OFF = 'DIV_OFF',

  // 상태 요청
  STATUS_REQUEST = 'STATUS_REQ',
  IO_STATUS_REQUEST = 'IO_STATUS_REQ',
}

// PLC 전문 메시지
export interface PLCMessage {
  messageId: string;
  commandType: PLCCommandType;
  equipmentId: string;
  parameters: PLCParameters;
  timestamp: string;
  sequenceNo: number;
}

export interface PLCParameters {
  chuteNumber?: number;       // 슈트번호
  speed?: number;             // 속도 (m/min)
  diverterNo?: number;        // 다이버터 번호
  ioAddress?: string;         // I/O 주소
  value?: number;             // 설정값
}

export const PLCMessageSchema = z.object({
  messageId: z.string().min(1),
  commandType: z.nativeEnum(PLCCommandType),
  equipmentId: z.string(),
  parameters: z.object({
    chuteNumber: z.number().int().optional(),
    speed: z.number().optional(),
    diverterNo: z.number().int().optional(),
    ioAddress: z.string().optional(),
    value: z.number().optional(),
  }),
  timestamp: z.string().datetime(),
  sequenceNo: z.number().int(),
});

// PLC 응답
export interface PLCResponse {
  messageId: string;
  requestId: string;           // 원본 요청 messageId
  resultCode: PLCResultCode;
  errorMessage?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export enum PLCResultCode {
  SUCCESS = 0,
  COMMAND_REJECTED = 1,
  INVALID_PARAMETER = 2,
  EQUIPMENT_BUSY = 3,
  EQUIPMENT_ERROR = 4,
  TIMEOUT = 5,
  NOT_READY = 6,
}

// PLC 상태 데이터
export interface PLCStatusData {
  equipmentId: string;
  running: boolean;
  speed: number;               // 현재 속도 (m/min)
  motorStatus: MotorStatus[];
  sensorStatus: SensorStatus[];
  alarmStatus: AlarmInfo[];
  chuteStatus: ChuteStatus[];
  operatingMode: OperatingMode;
  timestamp: string;
}

export enum OperatingMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  MAINTENANCE = 'MAINTENANCE',
}

export interface MotorStatus {
  motorId: string;
  name: string;
  running: boolean;
  speed: number;
  current: number;            // 전류 (A)
  temperature: number;        // 온도 (°C)
  fault: boolean;
}

export interface SensorStatus {
  sensorId: string;
  name: string;
  type: 'PHOTO' | 'PROXIMITY' | 'WEIGHT' | 'DIMENSION';
  active: boolean;
  value?: number;
}

export interface ChuteStatus {
  chuteNumber: number;
  name: string;
  open: boolean;
  full: boolean;
  itemCount: number;
  assignedDestination: string;
}

export interface AlarmInfo {
  alarmId: string;
  alarmCode: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING';
  message: string;
  active: boolean;
  occurredAt: string;
  clearedAt?: string;
}

/**
 * PLC 전문 바이너리 필드 정의
 * 실제 TCP 전문 구성 시 사용
 */
export interface PLCTelegramField {
  name: string;
  offset: number;       // 바이트 오프셋
  length: number;       // 바이트 길이
  type: 'ASCII' | 'BCD' | 'BINARY' | 'HEX';
  description: string;
}

export const PLC_TELEGRAM_FIELDS: PLCTelegramField[] = [
  { name: 'STX', offset: 0, length: 1, type: 'HEX', description: '전문시작 (0x02)' },
  { name: 'LENGTH', offset: 1, length: 4, type: 'BINARY', description: '전문길이' },
  { name: 'EQUIP_ID', offset: 5, length: 4, type: 'ASCII', description: '설비ID' },
  { name: 'CMD_CODE', offset: 9, length: 4, type: 'ASCII', description: '명령코드' },
  { name: 'SEQ_NO', offset: 13, length: 4, type: 'BINARY', description: '시퀀스번호' },
  { name: 'RESERVED', offset: 17, length: 3, type: 'ASCII', description: '예약영역' },
];
