/**
 * PLC 전문(Telegram) 공통 구조 정의
 *
 * 전문 공통 헤더:
 * - STX:        1 byte (0x02)
 * - DataType:   1 byte (Char, 패킷 종류)
 * - ModuleID:   6 bytes (Char, "PSM00\0" 형식)
 * - TelegramNo: 2 bytes (UInt16BE, 메시지 번호)
 * - DataLength: 2 bytes (UInt16BE, 가변 데이터 길이)
 * - [Data]:     가변 길이
 * - ETX:        1 byte (0x03)
 */

// 전문 상수
export const STX = 0x02;
export const ETX = 0x03;
export const HEADER_SIZE = 12;  // STX(1) + DataType(1) + ModuleID(6) + TelegramNo(2) + DataLength(2)
export const FOOTER_SIZE = 1;   // ETX(1)
export const MIN_TELEGRAM_SIZE = HEADER_SIZE + FOOTER_SIZE; // 13 bytes

/**
 * 전문 헤더
 */
export interface TelegramHeader {
  stx: number;              // 1 byte: 0x02
  dataType: string;         // 1 byte: Char
  moduleId: string;         // 6 bytes: Char ("PSM00\0" 등)
  telegramNo: number;       // 2 bytes: UInt16BE 메시지 번호
  dataLength: number;       // 2 bytes: UInt16BE 가변 데이터 길이
}

/**
 * 전문 전체 구조
 */
export interface Telegram<T = Record<string, number>> {
  header: TelegramHeader;
  data: T;
  etx: number;             // 1 byte: 0x03
}

/**
 * 전문 방향
 */
export enum TelegramDirection {
  PLC_TO_SMC = 'PLC_TO_SMC',
  SMC_TO_PLC = 'SMC_TO_PLC',
}

/**
 * PLC → SMC 전문 번호
 */
export enum PLCToSMCTelegram {
  HEARTBEAT = 1,
  SORTER_STATUS = 10,
  INDUCTION_STATUS = 11,
  INDUCTION_MODE = 12,
  ITEM_INDUCTED = 20,
  ITEM_DISCHARGED = 21,
  ITEM_SORTED_CONFIRM = 22,
  CODE_REQUEST = 40,
}

/**
 * SMC → PLC 전문 번호
 */
export enum SMCToPLCTelegram {
  DESTINATION_REQUEST = 30,
  CODE_RESULT = 41,
  SET_CONTROL_SORTER = 100,
  SET_CONTROL_SORTER_ACK = 101,
  SET_CONTROL_INDUCTION = 110,
  SET_CONTROL_INDUCTION_ACK = 111,
  SET_INDUCTION_MODE = 120,
  SET_INDUCTION_MODE_ACK = 121,
  SET_OVERFLOW_CONFIGURATION = 130,
  SET_OVERFLOW_CONFIGURATION_ACK = 131,
  SET_RESET_REQUEST = 140,
  SET_RESET_REQUEST_ACK = 141,
}

/**
 * 전문 데이터 필드 정의 (파서/빌더에서 사용)
 */
export interface TelegramFieldDef {
  name: string;
  size: number;   // bytes (2 = UInt16BE, 4 = UInt32BE)
}

/**
 * 전문 정의 메타데이터
 */
export interface TelegramDefinition {
  telegramNo: number;
  name: string;
  direction: TelegramDirection;
  description: string;
  fields: TelegramFieldDef[];
}

/**
 * 구분기 운전 상태
 */
export enum SorterStatus {
  STOPPED = 0,
  RUNNING = 1,
  STOPPING = 2,
  EMERGENCY = 3,
}

/**
 * 인덕션 상태
 */
export enum InductionStatus {
  STOPPED = 0,
  RUNNING = 1,
  FAULT = 2,
}

/**
 * 인덕션 모드
 */
export enum InductionMode {
  AUTO = 0,
  MANUAL_KEY = 1,
}

/**
 * 배출 결과
 */
export enum DischargeStatus {
  NORMAL = 0,
  RECIRCULATION = 1,
  NO_READ = 2,
  NO_DESTINATION = 3,
}

/**
 * 제어 요청
 */
export enum ControlRequest {
  STOP = 0,
  START = 1,
}
