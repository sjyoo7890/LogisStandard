/**
 * PLC 전문(Telegram) 테스트 픽스처
 */
export const TelegramFixtures = {
  /** 하트비트 전문 (Telegram 1) */
  heartbeat: {
    telegramNo: 1,
    heartbeatNo: 100,
    systemStatus: 0x01,
  },

  /** 구분기 제어 (Telegram 101 - SMC→PLC) */
  sorterControl: {
    telegramNo: 101,
    command: 'START',
    sorterSpeed: 2.0,
  },

  /** 인덕션 제어 (Telegram 102 - SMC→PLC) */
  inductionControl: {
    telegramNo: 102,
    inductionId: 1,
    command: 'START',
  },

  /** 인덕션 모드 설정 (Telegram 103 - SMC→PLC) */
  inductionMode: {
    telegramNo: 103,
    inductionId: 1,
    mode: 'AUTO',
  },

  /** 목적지 요청 응답 (Telegram 121 - SMC→PLC) */
  destinationResponse: {
    telegramNo: 121,
    pid: 'PID00001',
    destination: 5,
    reserved: 0,
  },

  /** 코드 결과 (Telegram 131 - SMC→PLC) */
  codeResult: {
    telegramNo: 131,
    pid: 'PID00001',
    barcode: '4210012345678',
    barcodeType: 1,
  },

  /** 투입 보고 (Telegram 20 - PLC→SMC) */
  inductionReport: {
    telegramNo: 20,
    pid: 'PID00001',
    inductionNo: 1,
    cellIndex: 42,
  },

  /** 배출 보고 (Telegram 21 - PLC→SMC) */
  dischargeReport: {
    telegramNo: 21,
    pid: 'PID00001',
    chuteNo: 5,
    result: 'NORMAL',
  },

  /** 배출 확인 (Telegram 22 - PLC→SMC) */
  dischargeConfirmation: {
    telegramNo: 22,
    pid: 'PID00001',
    confirmed: true,
  },

  /** 목적지 요청 (Telegram 23 - PLC→SMC) */
  destinationRequest: {
    telegramNo: 23,
    pid: 'PID00001',
    inductionNo: 1,
    cellIndex: 42,
  },

  /** 장애 보고 전문 */
  faultReport: {
    telegramNo: 30,
    faultType: 'MOTOR_TRIP',
    location: 'SORTER-MAIN',
    severity: 'CRITICAL',
  },

  /** 장애 복구 전문 */
  faultClear: {
    telegramNo: 31,
    faultType: 'MOTOR_TRIP',
    location: 'SORTER-MAIN',
  },

  /** 전문 바이트 생성 (테스트용) */
  buildRawBytes(telegramNo: number, payload: Buffer = Buffer.alloc(0)): Buffer {
    const STX = 0x02;
    const header = Buffer.alloc(8);
    header.writeUInt8(STX, 0);
    header.writeUInt16BE(telegramNo, 1);
    header.writeUInt16BE(payload.length + 8, 3);
    return Buffer.concat([header, payload]);
  },

  /** 채널 설정 */
  channels: [
    { id: 'CH1', name: 'SEND_HEARTBEAT', port: 5001 },
    { id: 'CH2', name: 'RECV_HEARTBEAT', port: 5002 },
    { id: 'CH3', name: 'SEND_COMMAND', port: 5003 },
    { id: 'CH4', name: 'RECV_STATUS', port: 5004 },
    { id: 'CH5', name: 'SEND_DESTINATION', port: 5005 },
    { id: 'CH6', name: 'RECV_REPORT', port: 5006 },
    { id: 'CH7', name: 'RECV_ALARM', port: 5007 },
  ],
};
