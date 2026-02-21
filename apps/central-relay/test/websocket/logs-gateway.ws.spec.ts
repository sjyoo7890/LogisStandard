import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LogsGateway } from '../../src/gateway/logs.gateway';
import { CommLogService } from '../../src/comm-log/comm-log.service';

/**
 * LogsGateway WebSocket 테스트 (/ws/logs)
 * - 클라이언트 연결/해제 처리
 * - 로그 스트림 수신 (2초 주기)
 * - 연결 시 최근 로그 즉시 수신
 * - 새 로그만 선별적으로 브로드캐스트
 */
describe('LogsGateway WebSocket 테스트 (/ws/logs)', () => {
  let app: INestApplication;
  let gateway: LogsGateway;
  let commLogService: CommLogService;

  // 서버와 클라이언트 소켓 모킹
  let mockServer: { emit: jest.Mock };
  let mockClient: { id: string; emit: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LogsGateway, CommLogService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    gateway = module.get<LogsGateway>(LogsGateway);
    commLogService = module.get<CommLogService>(CommLogService);

    // WebSocketServer 모킹
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // 모킹된 클라이언트
    mockClient = { id: 'log-client-001', emit: jest.fn() };
  });

  afterEach(async () => {
    gateway.onModuleDestroy();
    jest.useRealTimers();
    await app.close();
  });

  // ======================================================
  // 시나리오 1: 클라이언트 연결 처리
  // ======================================================
  describe('클라이언트 연결 처리', () => {
    it('클라이언트가 연결하면 connectedClients가 증가해야 한다', () => {
      expect((gateway as any).connectedClients).toBe(0);

      gateway.handleConnection(mockClient as any);
      expect((gateway as any).connectedClients).toBe(1);
    });

    it('클라이언트 연결 시 최근 로그를 즉시 전송해야 한다', () => {
      // 로그 데이터 생성
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '최근 로그 1',
      });
      commLogService.log({
        direction: 'OUTBOUND', sourceId: 'RELAY', targetId: 'SEOUL',
        protocol: 'TCP_SOCKET', messageType: 'PUSH', dataSize: 2048,
        message: '최근 로그 2',
      });

      gateway.handleConnection(mockClient as any);

      // client.emit('logs', ...) 호출 확인
      expect(mockClient.emit).toHaveBeenCalledWith(
        'logs',
        expect.arrayContaining([
          expect.objectContaining({ message: '최근 로그 2' }),
          expect.objectContaining({ message: '최근 로그 1' }),
        ]),
      );
    });

    it('로그가 없을 때 연결하면 빈 배열을 전송해야 한다', () => {
      gateway.handleConnection(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith('logs', []);
    });
  });

  // ======================================================
  // 시나리오 2: 클라이언트 해제 처리
  // ======================================================
  describe('클라이언트 해제 처리', () => {
    it('클라이언트가 해제하면 connectedClients가 감소해야 한다', () => {
      gateway.handleConnection(mockClient as any);
      expect((gateway as any).connectedClients).toBe(1);

      gateway.handleDisconnect(mockClient as any);
      expect((gateway as any).connectedClients).toBe(0);
    });

    it('모든 클라이언트 해제 후 브로드캐스트가 스킵되어야 한다', () => {
      gateway.afterInit();

      gateway.handleConnection(mockClient as any);
      gateway.handleDisconnect(mockClient as any);

      mockServer.emit.mockClear();

      // 새 로그 추가
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '새 로그',
      });

      // 2초 경과
      jest.advanceTimersByTime(2000);

      // 클라이언트가 없으므로 emit 호출 안 됨
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  // ======================================================
  // 시나리오 3: 로그 스트림 수신 (2초 주기)
  // ======================================================
  describe('로그 스트림 브로드캐스트 (2초 주기)', () => {
    it('afterInit 후 2초마다 새 로그를 브로드캐스트해야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();

      // 새 로그 추가
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'HEARTBEAT', dataSize: 64,
        message: '헬스체크 응답 수신',
      });

      // 2초 경과
      jest.advanceTimersByTime(2000);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'logs',
        expect.arrayContaining([
          expect.objectContaining({ message: '헬스체크 응답 수신' }),
        ]),
      );
    });

    it('새 로그가 없으면 브로드캐스트하지 않아야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();

      // 로그 없이 2초 경과
      jest.advanceTimersByTime(2000);

      // 로그가 없으므로 emit 호출 안 됨
      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('이미 전송된 로그는 중복 브로드캐스트하지 않아야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();

      // 로그 추가 및 첫 번째 브로드캐스트
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '첫 번째 로그',
      });

      jest.advanceTimersByTime(2000);
      expect(mockServer.emit).toHaveBeenCalledTimes(1);

      mockServer.emit.mockClear();

      // 새 로그 없이 다시 2초 경과
      jest.advanceTimersByTime(2000);

      // 새 로그가 없으므로 중복 전송 없어야 함
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  // ======================================================
  // 시나리오 4: 외부에서 로그 즉시 push
  // ======================================================
  describe('외부에서 로그 즉시 push (emitLogEntry)', () => {
    it('클라이언트가 있을 때 emitLogEntry를 통해 즉시 전송해야 한다', () => {
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();

      const logEntry = {
        id: 'LOG_INSTANT_1',
        direction: 'INBOUND',
        sourceId: 'SIMS',
        targetId: 'RELAY',
        message: '즉시 전송 로그',
      };

      gateway.emitLogEntry(logEntry);

      expect(mockServer.emit).toHaveBeenCalledWith('log', logEntry);
    });

    it('클라이언트가 없을 때 emitLogEntry는 전송하지 않아야 한다', () => {
      // 클라이언트 연결 없이 즉시 전송 시도
      gateway.emitLogEntry({ id: 'LOG_SKIP', message: '전송 안 됨' });

      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  // ======================================================
  // 시나리오 5: Gateway 정리
  // ======================================================
  describe('Gateway 정리', () => {
    it('onModuleDestroy 호출 시 브로드캐스트 타이머가 정리되어야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);

      // 정리
      gateway.onModuleDestroy();

      mockServer.emit.mockClear();

      // 로그 추가 후 시간 경과해도 브로드캐스트 안 됨
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '정리 후 로그',
      });

      jest.advanceTimersByTime(10000);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });
});
