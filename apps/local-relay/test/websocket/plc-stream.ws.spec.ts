import { Test, TestingModule } from '@nestjs/testing';
import { PLCStreamGateway } from '../../src/gateway/plc-stream.gateway';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';

/**
 * PLC 전문 스트림 WebSocket 게이트웨이 테스트
 * - PLC 전문 스트림 수신
 * - 클라이언트 연결/해제
 * - 주기적 상태 브로드캐스트
 */
describe('PLCStreamGateway WebSocket 테스트', () => {
  let gateway: PLCStreamGateway;
  let plcService: PLCConnectionService;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PLCStreamGateway, PLCConnectionService],
    }).compile();

    gateway = module.get<PLCStreamGateway>(PLCStreamGateway);
    plcService = module.get<PLCConnectionService>(PLCConnectionService);

    plcService.onModuleInit();

    // WebSocket Server 목 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 리스너 등록 및 브로드캐스트 인터벌 시작
    gateway.afterInit();
  });

  afterEach(() => {
    plcService.onModuleDestroy();
    jest.useRealTimers();
  });

  // 테스트 1: PLC 전문 이벤트 스트림 수신
  it('PLC 전문 송수신 시 WebSocket으로 telegram 이벤트가 브로드캐스트되어야 한다', () => {
    // 채널 연결
    plcService.connectChannel('SEND_DESTINATION');

    // 전문 송신 → telegram 이벤트 발행
    plcService.sendTelegram('SEND_DESTINATION', 30, Buffer.from([0x02, 0x44, 0x03]));

    // WebSocket emit 호출 확인
    expect(mockServer.emit).toHaveBeenCalledWith(
      'telegram',
      expect.objectContaining({
        channelName: 'SEND_DESTINATION',
        direction: 'SEND',
        telegramNo: 30,
      }),
    );

    // 전문 수신 → telegram 이벤트 발행
    plcService.receiveTelegram('SEND_DESTINATION', 31, Buffer.from([0x02, 0x41, 0x03]));

    expect(mockServer.emit).toHaveBeenCalledWith(
      'telegram',
      expect.objectContaining({
        channelName: 'SEND_DESTINATION',
        direction: 'RECEIVE',
        telegramNo: 31,
      }),
    );

    // 총 2회 telegram 이벤트 emit
    const telegramCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'telegram',
    );
    expect(telegramCalls.length).toBe(2);
  });

  // 테스트 2: 주기적 PLC 상태 브로드캐스트 (2초 간격)
  it('2초마다 PLC 상태가 브로드캐스트되어야 한다', () => {
    // 2초 경과 → plc-status 이벤트 발행
    jest.advanceTimersByTime(2000);

    const statusCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'plc-status',
    );
    expect(statusCalls.length).toBe(1);

    // 브로드캐스트된 상태 데이터 확인
    const statusData = statusCalls[0][1];
    expect(statusData).toHaveProperty('totalChannels');
    expect(statusData).toHaveProperty('connected');
    expect(statusData).toHaveProperty('disconnected');
    expect(statusData).toHaveProperty('heartbeatCount');
    expect(statusData.totalChannels).toBe(7);

    // 4초 경과 → 2번째 브로드캐스트
    jest.advanceTimersByTime(2000);
    const statusCalls2 = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'plc-status',
    );
    expect(statusCalls2.length).toBe(2);
  });

  // 테스트 3: 클라이언트 연결 시 실시간 데이터 수신 시나리오
  it('게이트웨이 초기화 후 전문 이벤트와 상태 브로드캐스트가 동시에 동작해야 한다', () => {
    // 채널 연결 및 전문 교환
    plcService.connectAll();
    plcService.sendTelegram('SEND_DESTINATION', 20, Buffer.from([0x02, 0x14, 0x01, 0x03]));
    plcService.receiveTelegram('SEND_DESTINATION', 21, Buffer.from([0x02, 0x15, 0x01, 0x03]));

    // telegram 이벤트 2건
    const telegramCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'telegram',
    );
    expect(telegramCalls.length).toBe(2);

    // 2초 경과 → 상태 브로드캐스트 1건
    jest.advanceTimersByTime(2000);
    const statusCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'plc-status',
    );
    expect(statusCalls.length).toBe(1);

    // 상태에 연결된 채널 수 반영
    const status = statusCalls[0][1];
    expect(status.connected).toBe(7);
    expect(status.totalTelegramsSent).toBe(1);
    expect(status.totalTelegramsReceived).toBe(1);
  });
});
