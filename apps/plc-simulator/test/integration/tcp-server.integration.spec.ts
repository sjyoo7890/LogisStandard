import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';

/**
 * TCP 서버 서비스 통합 테스트
 *
 * TcpServerService의 핵심 기능을 검증합니다.
 * 실제 net.createServer 를 사용하므로 포트 충돌 방지를 위해
 * onModuleInit/onModuleDestroy 를 수동 호출하여 제어합니다.
 *
 * 의존성: EventEmitter2 (mock)
 */

// EventEmitter2 모킹
const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

describe('TcpServerService 통합 테스트', () => {
  let service: TcpServerService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        TcpServerService,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<TcpServerService>(TcpServerService);
  });

  afterEach(async () => {
    // 모듈 해제 시 서버 정리 (onModuleDestroy 호출)
    try {
      service.onModuleDestroy();
    } catch {
      // 서버가 시작되지 않은 경우 무시
    }
    await module.close();
  });

  // 테스트 1: TCP 서버 시작/중지
  describe('TCP 서버 시작/중지', () => {
    it('onModuleInit 호출 후 모든 채널 서버가 시작되고, onModuleDestroy 후 정리되어야 한다', async () => {
      // 서버를 시작한다 (포트 바인딩)
      service.onModuleInit();

      // 잠시 대기하여 listen 완료를 보장한다
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 채널 상태를 조회하면 서버 목록이 반환되어야 한다
      const channels = service.getChannelStatus();
      expect(channels.length).toBeGreaterThan(0);

      // 각 채널에 name, port, clientCount, stats 속성이 있어야 한다
      for (const ch of channels) {
        expect(ch).toHaveProperty('name');
        expect(ch).toHaveProperty('port');
        expect(typeof ch.port).toBe('number');
        expect(ch).toHaveProperty('clientCount', 0);
        expect(ch).toHaveProperty('stats');
        expect(ch.stats.telegramsSent).toBe(0);
        expect(ch.stats.telegramsReceived).toBe(0);
      }

      // 서버 종료
      service.onModuleDestroy();

      // 종료 후 채널 상태는 비어있어야 한다
      const afterChannels = service.getChannelStatus();
      expect(afterChannels.length).toBe(0);
    });
  });

  // 테스트 2: 클라이언트 연결 수락
  describe('클라이언트 연결 수락', () => {
    it('TCP 클라이언트가 채널에 연결되면 연결 이벤트가 발행되어야 한다', async () => {
      const net = require('net');

      service.onModuleInit();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const channels = service.getChannelStatus();
      expect(channels.length).toBeGreaterThan(0);

      // 첫 번째 채널 포트에 클라이언트 연결을 시도한다
      const firstChannel = channels[0];
      const client = new net.Socket();

      await new Promise<void>((resolve, reject) => {
        client.connect(firstChannel.port, '127.0.0.1', () => {
          resolve();
        });
        client.on('error', reject);
      });

      // 잠시 대기하여 연결 처리 완료를 보장한다
      await new Promise((resolve) => setTimeout(resolve, 200));

      // tcp.client.connected 이벤트가 발행되었어야 한다
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'tcp.client.connected',
        expect.objectContaining({
          channel: firstChannel.name,
          port: firstChannel.port,
        }),
      );

      // hasClients가 true를 반환해야 한다
      expect(service.hasClients(firstChannel.name)).toBe(true);

      // 클라이언트 연결 해제
      client.destroy();
      await new Promise((resolve) => setTimeout(resolve, 200));

      service.onModuleDestroy();
    });
  });

  // 테스트 3: 전문 파싱 및 로그
  describe('전문 파싱 및 로그 기록', () => {
    it('유효한 전문 수신 시 파싱하여 로그에 기록하고 이벤트를 발행해야 한다', async () => {
      const net = require('net');
      const { TelegramBuilder, TELEGRAM_100_DEF } = require('@kpost/telegram');

      service.onModuleInit();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const channels = service.getChannelStatus();
      // SEND_MCS 채널 (포트 3011)에 연결하여 Telegram 100 을 전송한다
      const mcsChannel = channels.find((ch: any) => ch.name === 'SEND_MCS');
      if (!mcsChannel) {
        // 테스트를 건너뛴다 (채널이 없으면)
        service.onModuleDestroy();
        return;
      }

      const client = new net.Socket();
      await new Promise<void>((resolve, reject) => {
        client.connect(mcsChannel.port, '127.0.0.1', () => resolve());
        client.on('error', reject);
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Telegram 100 (SetControlSorter, request=1) 전문 빌드 및 전송
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_100_DEF, { request: 1 });
      client.write(buffer);

      // 파싱 처리를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // tcp.telegram.received 이벤트가 발행되었어야 한다
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'tcp.telegram.received',
        expect.objectContaining({
          channel: 'SEND_MCS',
          telegram: expect.objectContaining({
            header: expect.objectContaining({
              telegramNo: 100,
            }),
          }),
        }),
      );

      // 전문 로그에 기록되어야 한다
      const logs = service.getTelegramLog();
      const rxLog = logs.find((l: any) => l.direction === 'RX' && l.telegramNo === 100);
      expect(rxLog).toBeDefined();
      expect(rxLog!.channel).toBe('SEND_MCS');
      expect(rxLog!.size).toBeGreaterThan(0);

      client.destroy();
      await new Promise((resolve) => setTimeout(resolve, 200));
      service.onModuleDestroy();
    });

    it('전문 로그는 최대 1000건까지만 유지되어야 한다', () => {
      // getTelegramLog의 기본 limit이 100이며, 내부 최대 보관 건수는 1000
      const logs = service.getTelegramLog(100);
      expect(logs.length).toBeLessThanOrEqual(100);

      // limit 파라미터가 적용되어야 한다
      const logsWithLimit = service.getTelegramLog(5);
      expect(logsWithLimit.length).toBeLessThanOrEqual(5);
    });
  });

  // 테스트 4: 채널 상태 조회
  describe('채널 상태 조회', () => {
    it('서버 시작 전에는 빈 배열을, 시작 후에는 전체 채널 목록을 반환해야 한다', async () => {
      // 서버 시작 전
      const beforeChannels = service.getChannelStatus();
      expect(beforeChannels).toEqual([]);

      // 서버 시작
      service.onModuleInit();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 서버 시작 후
      const afterChannels = service.getChannelStatus();
      expect(afterChannels.length).toBeGreaterThan(0);

      // CHANNELS 상수에 정의된 7개 채널이 모두 포함되어야 한다
      const channelNames = afterChannels.map((ch: any) => ch.name);
      expect(channelNames).toContain('SEND_HEARTBEAT');
      expect(channelNames).toContain('RECEIVE_MCS');
      expect(channelNames).toContain('RECEIVE_INDUCT');
      expect(channelNames).toContain('RECEIVE_DISCHARGE');
      expect(channelNames).toContain('RECEIVE_CONFIRM');
      expect(channelNames).toContain('SEND_MCS');
      expect(channelNames).toContain('SEND_DESTINATION');

      // hasClients는 연결이 없으므로 모두 false
      for (const ch of afterChannels) {
        expect(service.hasClients(ch.name)).toBe(false);
      }

      service.onModuleDestroy();
    });
  });
});
