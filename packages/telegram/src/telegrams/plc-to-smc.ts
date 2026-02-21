import { TelegramDefinition, TelegramDirection, TelegramFieldDef } from '../types';

/**
 * PLC → SMC 전문 정의
 * 모든 필드 크기는 bytes (2 = UInt16BE, 4 = UInt32BE)
 */

// Telegram 1: HeartBeat
export interface HeartBeatData {
  acknowledgeStatus: number;   // 2 bytes
  heartBeatNo: number;         // 2 bytes
}

export const TELEGRAM_1_FIELDS: TelegramFieldDef[] = [
  { name: 'acknowledgeStatus', size: 2 },
  { name: 'heartBeatNo', size: 2 },
];

export const TELEGRAM_1_DEF: TelegramDefinition = {
  telegramNo: 1,
  name: 'HeartBeat',
  direction: TelegramDirection.PLC_TO_SMC,
  description: 'PLC 하트비트 (생존 확인)',
  fields: TELEGRAM_1_FIELDS,
};

// Telegram 10: SorterStatus
export interface SorterStatusData {
  sorterStatus: number;        // 2 bytes (0=정지, 1=가동, 2=정지중, 3=비상)
}

export const TELEGRAM_10_FIELDS: TelegramFieldDef[] = [
  { name: 'sorterStatus', size: 2 },
];

export const TELEGRAM_10_DEF: TelegramDefinition = {
  telegramNo: 10,
  name: 'SorterStatus',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '구분기 운전/정지 상태',
  fields: TELEGRAM_10_FIELDS,
};

// Telegram 11: InductionStatus
export interface InductionStatusData {
  inductionCount: number;      // 2 bytes: 인덕션 수
  inductionNo: number;         // 2 bytes: 인덕션 번호
  inductionStatus: number;     // 2 bytes: 상태 (0=정지, 1=가동, 2=고장)
}

export const TELEGRAM_11_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionCount', size: 2 },
  { name: 'inductionNo', size: 2 },
  { name: 'inductionStatus', size: 2 },
];

export const TELEGRAM_11_DEF: TelegramDefinition = {
  telegramNo: 11,
  name: 'InductionStatus',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '인덕션 운전/정지 상태',
  fields: TELEGRAM_11_FIELDS,
};

// Telegram 12: InductionMode
export interface InductionModeData {
  inductionCount: number;      // 2 bytes
  inductionNo: number;         // 2 bytes
  inductionMode: number;       // 2 bytes (0=자동, 1=타건)
}

export const TELEGRAM_12_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionCount', size: 2 },
  { name: 'inductionNo', size: 2 },
  { name: 'inductionMode', size: 2 },
];

export const TELEGRAM_12_DEF: TelegramDefinition = {
  telegramNo: 12,
  name: 'InductionMode',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '인덕션 모드 상태 (자동/타건)',
  fields: TELEGRAM_12_FIELDS,
};

// Telegram 20: ItemInducted (소포 투입)
export interface ItemInductedData {
  cellIndex: number;           // 2 bytes: 캐리어 셀 번호
  inductionNo: number;         // 2 bytes: 투입 인덕션 번호
  mode: number;                // 2 bytes: 투입 모드 (0=자동, 1=타건)
  pid: number;                 // 4 bytes: Parcel ID
  cartNumber: number;          // 2 bytes: 카트 번호
  destination1: number;        // 2 bytes: 목적지 1 (1순위)
  destination2: number;        // 2 bytes: 목적지 2
  destination3: number;        // 2 bytes: 목적지 3
  destination4: number;        // 2 bytes: 목적지 4
  destination5: number;        // 2 bytes: 목적지 5
  destination6: number;        // 2 bytes: 목적지 6
  destination7: number;        // 2 bytes: 목적지 7
  destination8: number;        // 2 bytes: 목적지 8 (최하위)
}

export const TELEGRAM_20_FIELDS: TelegramFieldDef[] = [
  { name: 'cellIndex', size: 2 },
  { name: 'inductionNo', size: 2 },
  { name: 'mode', size: 2 },
  { name: 'pid', size: 4 },
  { name: 'cartNumber', size: 2 },
  { name: 'destination1', size: 2 },
  { name: 'destination2', size: 2 },
  { name: 'destination3', size: 2 },
  { name: 'destination4', size: 2 },
  { name: 'destination5', size: 2 },
  { name: 'destination6', size: 2 },
  { name: 'destination7', size: 2 },
  { name: 'destination8', size: 2 },
];

export const TELEGRAM_20_DEF: TelegramDefinition = {
  telegramNo: 20,
  name: 'ItemInducted',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '소포 투입 정보',
  fields: TELEGRAM_20_FIELDS,
};

// Telegram 21: ItemDischarged (소포 배출)
export interface ItemDischargedData {
  cellIndex: number;           // 2 bytes
  inductionNo: number;         // 2 bytes
  mode: number;                // 2 bytes
  chuteNumber: number;         // 2 bytes: 배출 슈트 번호
  recirculationCount: number;  // 2 bytes: 재순환 횟수
}

export const TELEGRAM_21_FIELDS: TelegramFieldDef[] = [
  { name: 'cellIndex', size: 2 },
  { name: 'inductionNo', size: 2 },
  { name: 'mode', size: 2 },
  { name: 'chuteNumber', size: 2 },
  { name: 'recirculationCount', size: 2 },
];

export const TELEGRAM_21_DEF: TelegramDefinition = {
  telegramNo: 21,
  name: 'ItemDischarged',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '소포 배출 정보',
  fields: TELEGRAM_21_FIELDS,
};

// Telegram 22: ItemSortedConfirm (구분완료 확인)
export interface ItemSortedConfirmData {
  cellIndex: number;           // 2 bytes
  mode: number;                // 2 bytes
  chuteNumber: number;         // 2 bytes
  recirculationCount: number;  // 2 bytes
  status: number;              // 2 bytes (0=정상, 1=재순환, 2=미인식, 3=목적지없음)
}

export const TELEGRAM_22_FIELDS: TelegramFieldDef[] = [
  { name: 'cellIndex', size: 2 },
  { name: 'mode', size: 2 },
  { name: 'chuteNumber', size: 2 },
  { name: 'recirculationCount', size: 2 },
  { name: 'status', size: 2 },
];

export const TELEGRAM_22_DEF: TelegramDefinition = {
  telegramNo: 22,
  name: 'ItemSortedConfirm',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '구분완료 확인',
  fields: TELEGRAM_22_FIELDS,
};

// Telegram 40: CodeRequest (타건 요청)
export interface CodeRequestData {
  inductionNo: number;         // 2 bytes
}

export const TELEGRAM_40_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
];

export const TELEGRAM_40_DEF: TelegramDefinition = {
  telegramNo: 40,
  name: 'CodeRequest',
  direction: TelegramDirection.PLC_TO_SMC,
  description: '타건(수동 바코드 입력) 요청',
  fields: TELEGRAM_40_FIELDS,
};

/**
 * PLC → SMC 전문 정의 목록
 */
export const PLC_TO_SMC_DEFINITIONS: TelegramDefinition[] = [
  TELEGRAM_1_DEF,
  TELEGRAM_10_DEF,
  TELEGRAM_11_DEF,
  TELEGRAM_12_DEF,
  TELEGRAM_20_DEF,
  TELEGRAM_21_DEF,
  TELEGRAM_22_DEF,
  TELEGRAM_40_DEF,
];
