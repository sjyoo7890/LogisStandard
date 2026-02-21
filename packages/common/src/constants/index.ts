// 기본 포트 설정
export const DEFAULT_PORTS = {
  CENTRAL_RELAY: 3000,
  LOCAL_RELAY: 3100,
  STANDARD_SW: 3200,
  WEB_DASHBOARD: 5173,
  PLC_SIMULATOR: 4000,
  POSTGRESQL: 5432,
  REDIS: 6379,
} as const;

// PLC 통신 설정
export const PLC_CONFIG = {
  DEFAULT_PORT: 9100,
  HEARTBEAT_INTERVAL_MS: 5000,
  RECONNECT_INTERVAL_MS: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
  TELEGRAM_HEADER_SIZE: 20,
  TELEGRAM_MAX_SIZE: 4096,
} as const;

// 외부 시스템 연계
export const EXTERNAL_SYSTEMS = {
  SIMS: {
    NAME: '종합정보시스템',
    PROTOCOL: 'REST_API',
  },
  KPLAS: {
    NAME: '물류통합정보시스템',
    PROTOCOL: 'REST_API',
  },
} as const;

// 로깅 관련
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'verbose'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
