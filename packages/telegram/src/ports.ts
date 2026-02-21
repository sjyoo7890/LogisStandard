/**
 * PLC ↔ SMC 통신 포트 구성
 */

export interface ChannelConfig {
  name: string;
  port: number;
  direction: 'SEND' | 'RECEIVE';
  description: string;
}

/**
 * 통신 채널 포트 정의
 */
export const CHANNELS: Record<string, ChannelConfig> = {
  SEND_DESTINATION: {
    name: 'Send Channel-Destination',
    port: 3003,
    direction: 'SEND',
    description: '목적지 요청 송신 (Telegram 30)',
  },
  SEND_MCS: {
    name: 'Send Channel-MCS',
    port: 3011,
    direction: 'SEND',
    description: 'MCS 제어 명령 송신 (Telegram 100~141)',
  },
  SEND_HEARTBEAT: {
    name: 'Send Channel-Heartbeat',
    port: 3001,
    direction: 'SEND',
    description: '하트비트 송신 (Telegram 1)',
  },
  RECEIVE_DISCHARGE: {
    name: 'Receive Channel-Discharge',
    port: 3000,
    direction: 'RECEIVE',
    description: '배출 정보 수신 (Telegram 21)',
  },
  RECEIVE_CONFIRM: {
    name: 'Receive Channel-Confirm',
    port: 3004,
    direction: 'RECEIVE',
    description: '구분완료 확인 수신 (Telegram 22)',
  },
  RECEIVE_MCS: {
    name: 'Receive Channel-MCS',
    port: 3010,
    direction: 'RECEIVE',
    description: 'MCS 상태 수신 (Telegram 10~12)',
  },
  RECEIVE_INDUCT: {
    name: 'Receive Channel-Induct',
    port: 3006,
    direction: 'RECEIVE',
    description: '투입 정보 수신 (Telegram 20)',
  },
};

/**
 * 전문번호 → 채널 매핑
 */
export function getChannelForTelegram(telegramNo: number): ChannelConfig | null {
  switch (telegramNo) {
    case 1: return CHANNELS.SEND_HEARTBEAT;
    case 10:
    case 11:
    case 12: return CHANNELS.RECEIVE_MCS;
    case 20: return CHANNELS.RECEIVE_INDUCT;
    case 21: return CHANNELS.RECEIVE_DISCHARGE;
    case 22: return CHANNELS.RECEIVE_CONFIRM;
    case 30: return CHANNELS.SEND_DESTINATION;
    case 40: return CHANNELS.RECEIVE_INDUCT;
    case 41:
    case 100: case 101:
    case 110: case 111:
    case 120: case 121:
    case 130: case 131:
    case 140: case 141: return CHANNELS.SEND_MCS;
    default: return null;
  }
}
