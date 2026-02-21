import { TelegramDefinition, TelegramDirection, TelegramFieldDef } from '../types';

/**
 * SMC → PLC 전문 정의
 */

// Telegram 30: DestinationRequest (목적지 요청 - 자동)
export interface DestinationRequestData {
  inductionNo: number;         // 2 bytes
  pid: number;                 // 4 bytes: Parcel ID
  destination1: number;        // 2 bytes
  destination2: number;        // 2 bytes
  destination3: number;        // 2 bytes
  destination4: number;        // 2 bytes
  destination5: number;        // 2 bytes
  destination6: number;        // 2 bytes
  destination7: number;        // 2 bytes
  destination8: number;        // 2 bytes
}

export const TELEGRAM_30_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
  { name: 'pid', size: 4 },
  { name: 'destination1', size: 2 },
  { name: 'destination2', size: 2 },
  { name: 'destination3', size: 2 },
  { name: 'destination4', size: 2 },
  { name: 'destination5', size: 2 },
  { name: 'destination6', size: 2 },
  { name: 'destination7', size: 2 },
  { name: 'destination8', size: 2 },
];

export const TELEGRAM_30_DEF: TelegramDefinition = {
  telegramNo: 30,
  name: 'DestinationRequest',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '목적지 요청 (자동 모드)',
  fields: TELEGRAM_30_FIELDS,
};

// Telegram 41: CodeResult (타건 결과)
export interface CodeResultData {
  telegramNo: number;          // 2 bytes: 원본 요청 전문 번호
  cellIndexNo: number;         // 2 bytes: 셀 인덱스
  destination1: number;        // 2 bytes
  destination2: number;        // 2 bytes
  destination3: number;        // 2 bytes
  destination4: number;        // 2 bytes
  destination5: number;        // 2 bytes
  destination6: number;        // 2 bytes
  destination7: number;        // 2 bytes
  destination8: number;        // 2 bytes
}

export const TELEGRAM_41_FIELDS: TelegramFieldDef[] = [
  { name: 'telegramNo', size: 2 },
  { name: 'cellIndexNo', size: 2 },
  { name: 'destination1', size: 2 },
  { name: 'destination2', size: 2 },
  { name: 'destination3', size: 2 },
  { name: 'destination4', size: 2 },
  { name: 'destination5', size: 2 },
  { name: 'destination6', size: 2 },
  { name: 'destination7', size: 2 },
  { name: 'destination8', size: 2 },
];

export const TELEGRAM_41_DEF: TelegramDefinition = {
  telegramNo: 41,
  name: 'CodeResult',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '타건 결과 (수동 바코드 입력 결과)',
  fields: TELEGRAM_41_FIELDS,
};

// Telegram 100: SetControlSorter (구분기 운전/정지)
export interface SetControlSorterData {
  request: number;             // 2 bytes (0=정지, 1=가동)
}

export const TELEGRAM_100_FIELDS: TelegramFieldDef[] = [
  { name: 'request', size: 2 },
];

export const TELEGRAM_100_DEF: TelegramDefinition = {
  telegramNo: 100,
  name: 'SetControlSorter',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '구분기 운전/정지 제어',
  fields: TELEGRAM_100_FIELDS,
};

// Telegram 101: SetControlSorterAck (응답)
export interface SetControlSorterAckData {
  request: number;             // 2 bytes
  reason: number;              // 2 bytes (0=성공, 그 외=에러코드)
}

export const TELEGRAM_101_FIELDS: TelegramFieldDef[] = [
  { name: 'request', size: 2 },
  { name: 'reason', size: 2 },
];

export const TELEGRAM_101_DEF: TelegramDefinition = {
  telegramNo: 101,
  name: 'SetControlSorterAck',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '구분기 운전/정지 제어 응답',
  fields: TELEGRAM_101_FIELDS,
};

// Telegram 110: SetControlInduction (인덕션 운전/정지)
export interface SetControlInductionData {
  inductionNo: number;         // 2 bytes
  request: number;             // 2 bytes (0=정지, 1=가동)
}

export const TELEGRAM_110_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
  { name: 'request', size: 2 },
];

export const TELEGRAM_110_DEF: TelegramDefinition = {
  telegramNo: 110,
  name: 'SetControlInduction',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '인덕션 운전/정지 제어',
  fields: TELEGRAM_110_FIELDS,
};

// Telegram 111: SetControlInductionAck (응답)
export interface SetControlInductionAckData {
  inductionNo: number;         // 2 bytes
  status: number;              // 2 bytes
  reason: number;              // 2 bytes
}

export const TELEGRAM_111_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
  { name: 'status', size: 2 },
  { name: 'reason', size: 2 },
];

export const TELEGRAM_111_DEF: TelegramDefinition = {
  telegramNo: 111,
  name: 'SetControlInductionAck',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '인덕션 운전/정지 제어 응답',
  fields: TELEGRAM_111_FIELDS,
};

// Telegram 120: SetInductionMode (모드변경)
export interface SetInductionModeData {
  inductionNo: number;         // 2 bytes
  request: number;             // 2 bytes (0=자동, 1=타건)
}

export const TELEGRAM_120_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
  { name: 'request', size: 2 },
];

export const TELEGRAM_120_DEF: TelegramDefinition = {
  telegramNo: 120,
  name: 'SetInductionMode',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '인덕션 모드 변경 (자동/타건)',
  fields: TELEGRAM_120_FIELDS,
};

// Telegram 121: SetInductionModeAck (응답)
export interface SetInductionModeAckData {
  inductionNo: number;         // 2 bytes
  request: number;             // 2 bytes
}

export const TELEGRAM_121_FIELDS: TelegramFieldDef[] = [
  { name: 'inductionNo', size: 2 },
  { name: 'request', size: 2 },
];

export const TELEGRAM_121_DEF: TelegramDefinition = {
  telegramNo: 121,
  name: 'SetInductionModeAck',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '인덕션 모드 변경 응답',
  fields: TELEGRAM_121_FIELDS,
};

// Telegram 130: SetOverflowConfiguration (오버플로 설정)
export interface SetOverflowConfigurationData {
  overflowChute1: number;      // 2 bytes: 오버플로 슈트 1
  overflowChute2: number;      // 2 bytes: 오버플로 슈트 2
  maxRecirculation: number;    // 2 bytes: 최대 재순환 횟수
  reason: number;              // 2 bytes
}

export const TELEGRAM_130_FIELDS: TelegramFieldDef[] = [
  { name: 'overflowChute1', size: 2 },
  { name: 'overflowChute2', size: 2 },
  { name: 'maxRecirculation', size: 2 },
  { name: 'reason', size: 2 },
];

export const TELEGRAM_130_DEF: TelegramDefinition = {
  telegramNo: 130,
  name: 'SetOverflowConfiguration',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '오버플로 슈트 및 재순환 설정',
  fields: TELEGRAM_130_FIELDS,
};

// Telegram 131: SetOverflowConfigurationAck (응답)
export interface SetOverflowConfigurationAckData {
  overflowChute1: number;      // 2 bytes
  overflowChute2: number;      // 2 bytes
  maxRecirculation: number;    // 2 bytes
  reason: number;              // 2 bytes
}

export const TELEGRAM_131_FIELDS: TelegramFieldDef[] = [
  { name: 'overflowChute1', size: 2 },
  { name: 'overflowChute2', size: 2 },
  { name: 'maxRecirculation', size: 2 },
  { name: 'reason', size: 2 },
];

export const TELEGRAM_131_DEF: TelegramDefinition = {
  telegramNo: 131,
  name: 'SetOverflowConfigurationAck',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '오버플로 설정 응답',
  fields: TELEGRAM_131_FIELDS,
};

// Telegram 140: SetResetRequest (알람 해제)
export interface SetResetRequestData {
  resetModule: number;         // 2 bytes: 리셋 대상 모듈
}

export const TELEGRAM_140_FIELDS: TelegramFieldDef[] = [
  { name: 'resetModule', size: 2 },
];

export const TELEGRAM_140_DEF: TelegramDefinition = {
  telegramNo: 140,
  name: 'SetResetRequest',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '알람 해제 요청',
  fields: TELEGRAM_140_FIELDS,
};

// Telegram 141: SetResetRequestAck (응답)
export interface SetResetRequestAckData {
  resetModule: number;         // 2 bytes
}

export const TELEGRAM_141_FIELDS: TelegramFieldDef[] = [
  { name: 'resetModule', size: 2 },
];

export const TELEGRAM_141_DEF: TelegramDefinition = {
  telegramNo: 141,
  name: 'SetResetRequestAck',
  direction: TelegramDirection.SMC_TO_PLC,
  description: '알람 해제 응답',
  fields: TELEGRAM_141_FIELDS,
};

/**
 * SMC → PLC 전문 정의 목록
 */
export const SMC_TO_PLC_DEFINITIONS: TelegramDefinition[] = [
  TELEGRAM_30_DEF,
  TELEGRAM_41_DEF,
  TELEGRAM_100_DEF,
  TELEGRAM_101_DEF,
  TELEGRAM_110_DEF,
  TELEGRAM_111_DEF,
  TELEGRAM_120_DEF,
  TELEGRAM_121_DEF,
  TELEGRAM_130_DEF,
  TELEGRAM_131_DEF,
  TELEGRAM_140_DEF,
  TELEGRAM_141_DEF,
];
