import { Test, TestingModule } from '@nestjs/testing';
import { PLCConnectionService, ChannelStatus, TelegramEvent } from '../../src/plc-connection/plc-connection.service';

/**
 * PLC 소켓통신 서비스 통합 테스트
 * - TCP/IP 채널 연결/해제
 * - 전문 송수신 시뮬레이션
 * - 채널 상태 조회
 * - 전문 로그 확인
 */
describe('PLCConnectionService 통합 테스트', () => {
  let service: PLCConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PLCConnectionService],
    }).compile();

    service = module.get<PLCConnectionService>(PLCConnectionService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // 테스트 1: PLC 채널 연결 및 해제 사이클
  it('채널 연결 → 전문 송신 → 해제 전체 사이클이 정상 동작해야 한다', () => {
    // 초기 상태: 모든 채널 DISCONNECTED
    const initialStatus = service.getStatus();
    expect(initialStatus.totalChannels).toBe(7);
    expect(initialStatus.connected).toBe(0);
    expect(initialStatus.disconnected).toBe(7);

    // 특정 채널 연결
    const connected = service.connectChannel('SEND_DESTINATION');
    expect(connected).toBe(true);

    const channel = service.getChannel('SEND_DESTINATION');
    expect(channel).toBeDefined();
    expect(channel!.status).toBe('CONNECTED');
    expect(channel!.lastActivity).toBeDefined();
    expect(channel!.reconnectAttempts).toBe(0);

    // 연결된 채널 수 확인
    expect(service.getConnectedCount()).toBe(1);

    // 채널 해제
    const disconnected = service.disconnectChannel('SEND_DESTINATION');
    expect(disconnected).toBe(true);
    expect(service.getChannel('SEND_DESTINATION')!.status).toBe('DISCONNECTED');
    expect(service.getConnectedCount()).toBe(0);
  });

  // 테스트 2: 전문 송수신 및 로그 기록
  it('전문 송수신 시 로그가 정확히 기록되어야 한다', () => {
    // 채널 연결
    service.connectChannel('SEND_DESTINATION');

    // 전문 송신
    const sendData = Buffer.from([0x02, 0x44, 0x45, 0x53, 0x54, 0x03]);
    const sendResult = service.sendTelegram('SEND_DESTINATION', 30, sendData);
    expect(sendResult).toBe(true);

    // 전문 수신
    const recvData = Buffer.from([0x02, 0x41, 0x43, 0x4B, 0x03]);
    service.receiveTelegram('SEND_DESTINATION', 31, recvData);

    // 로그 확인 - 최신 항목이 먼저 오므로 수신이 [0], 송신이 [1]
    const log = service.getTelegramLog();
    expect(log.length).toBe(2);

    // 수신 로그 (최신)
    expect(log[0].direction).toBe('RECEIVE');
    expect(log[0].telegramNo).toBe(31);
    expect(log[0].channelName).toBe('SEND_DESTINATION');
    expect(log[0].size).toBe(recvData.length);

    // 송신 로그
    expect(log[1].direction).toBe('SEND');
    expect(log[1].telegramNo).toBe(30);
    expect(log[1].rawHex).toBe(sendData.toString('hex').toUpperCase());

    // 상태 통계 확인
    const status = service.getStatus();
    expect(status.totalTelegramsSent).toBe(1);
    expect(status.totalTelegramsReceived).toBe(1);
    expect(status.totalBytesTransferred).toBe(sendData.length + recvData.length);
  });

  // 테스트 3: 모든 채널 일괄 연결/해제 및 상태 조회
  it('connectAll/disconnectAll로 7개 채널이 일괄 관리되어야 한다', () => {
    // 전체 연결
    service.connectAll();
    expect(service.getConnectedCount()).toBe(7);

    const allChannels = service.getAllChannels();
    expect(allChannels.length).toBe(7);
    for (const ch of allChannels) {
      expect(ch.status).toBe('CONNECTED');
      expect(ch.lastActivity).toBeDefined();
    }

    // 전체 상태 확인
    const status = service.getStatus();
    expect(status.connected).toBe(7);
    expect(status.disconnected).toBe(0);

    // 전체 해제
    service.disconnectAll();
    expect(service.getConnectedCount()).toBe(0);

    for (const ch of service.getAllChannels()) {
      expect(ch.status).toBe('DISCONNECTED');
    }
  });

  // 테스트 4: 연결 상태 변경 리스너 및 전문 이벤트 리스너
  it('연결 상태 변경 및 전문 이벤트 리스너가 정상 호출되어야 한다', () => {
    const connectionEvents: Array<{ channel: string; status: ChannelStatus }> = [];
    const telegramEvents: TelegramEvent[] = [];

    // 리스너 등록
    service.onConnectionChange((channel, status) => {
      connectionEvents.push({ channel, status });
    });

    service.onTelegramEvent((event) => {
      telegramEvents.push(event);
    });

    // 채널 연결 → 연결 이벤트 발생
    service.connectChannel('SEND_DESTINATION');
    expect(connectionEvents.length).toBe(1);
    expect(connectionEvents[0].status).toBe('CONNECTED');

    // 전문 송신 → 전문 이벤트 발생
    service.sendTelegram('SEND_DESTINATION', 30, [0x02, 0x44]);
    expect(telegramEvents.length).toBe(1);
    expect(telegramEvents[0].direction).toBe('SEND');

    // 채널 해제 → 해제 이벤트 발생
    service.disconnectChannel('SEND_DESTINATION');
    expect(connectionEvents.length).toBe(2);
    expect(connectionEvents[1].status).toBe('DISCONNECTED');
  });

  // 테스트 5: 비정상 케이스 (미연결 송신, 존재하지 않는 채널)
  it('비정상 케이스에서 안전하게 실패 처리되어야 한다', () => {
    // 존재하지 않는 채널 연결 시도
    expect(service.connectChannel('INVALID_CHANNEL')).toBe(false);
    expect(service.disconnectChannel('INVALID_CHANNEL')).toBe(false);

    // 미연결 상태에서 전문 송신 시도 → 실패
    const sendResult = service.sendTelegram('SEND_DESTINATION', 30, [0x02]);
    expect(sendResult).toBe(false);

    // 전문 로그에 기록되지 않아야 함
    expect(service.getTelegramLog().length).toBe(0);

    // HeartBeat 카운터 초기값 확인
    expect(service.getHeartbeatCount()).toBe(0);

    // 전체 상태는 정상적으로 반환
    const status = service.getStatus();
    expect(status.totalChannels).toBe(7);
    expect(status.totalTelegramsSent).toBe(0);
    expect(status.totalTelegramsReceived).toBe(0);
  });
});
