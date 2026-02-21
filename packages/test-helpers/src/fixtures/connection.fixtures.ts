/**
 * 연결 상태 테스트 픽스처
 */
export const ConnectionFixtures = {
  /** SIMS 연결 정보 */
  simsConnection: {
    id: 'SIMS',
    name: 'SIMS DB2DB',
    host: '10.0.0.1',
    port: 1521,
    status: 'CONNECTED' as const,
    lastHeartbeat: new Date().toISOString(),
  },

  /** 로컬 중계기 연결 목록 */
  localRelays: [
    { id: 'LOCAL-SEOUL', name: '서울집중국', host: '10.1.0.1', port: 3001, status: 'CONNECTED' as const },
    { id: 'LOCAL-BUSAN', name: '부산집중국', host: '10.2.0.1', port: 3001, status: 'CONNECTED' as const },
    { id: 'LOCAL-DAEGU', name: '대구집중국', host: '10.3.0.1', port: 3001, status: 'DISCONNECTED' as const },
    { id: 'LOCAL-GWANGJU', name: '광주집중국', host: '10.4.0.1', port: 3001, status: 'CONNECTED' as const },
    { id: 'LOCAL-DAEJEON', name: '대전집중국', host: '10.5.0.1', port: 3001, status: 'CONNECTED' as const },
  ],

  /** PLC 채널 연결 상태 */
  plcChannels: [
    { channel: 'CH1', name: 'SEND_HEARTBEAT', host: '192.168.1.10', port: 5001, connected: true },
    { channel: 'CH2', name: 'RECV_HEARTBEAT', host: '192.168.1.10', port: 5002, connected: true },
    { channel: 'CH3', name: 'SEND_COMMAND', host: '192.168.1.10', port: 5003, connected: true },
    { channel: 'CH4', name: 'RECV_STATUS', host: '192.168.1.10', port: 5004, connected: false },
    { channel: 'CH5', name: 'SEND_DESTINATION', host: '192.168.1.10', port: 5005, connected: true },
    { channel: 'CH6', name: 'RECV_REPORT', host: '192.168.1.10', port: 5006, connected: true },
    { channel: 'CH7', name: 'RECV_ALARM', host: '192.168.1.10', port: 5007, connected: true },
  ],

  /** 시스템 상태 */
  systemStatus: {
    healthy: { overall: 'HEALTHY', connections: 6, total: 6 },
    degraded: { overall: 'DEGRADED', connections: 4, total: 6 },
    critical: { overall: 'CRITICAL', connections: 1, total: 6 },
  },

  /** Fallback 상태 */
  fallbackStatus: {
    normal: { mode: 'NORMAL', simsConnected: true, pendingRecords: 0 },
    fallback: { mode: 'FALLBACK', simsConnected: false, pendingRecords: 15 },
    recovering: { mode: 'RECOVERING', simsConnected: true, pendingRecords: 5 },
  },

  /** 설정 업데이트 DTO */
  configUpdate: {
    simsHost: '10.0.0.2',
    simsPort: 1522,
    syncInterval: 300000,
  },
};
