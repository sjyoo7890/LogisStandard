import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { StatusGateway } from '../../src/gateway/status.gateway';
import { ConnectionService } from '../../src/connection/connection.service';

/**
 * StatusGateway WebSocket 테스트 (/ws/status)
 * - 클라이언트 연결/해제 처리
 * - 상태 브로드캐스트 수신 (3초 주기)
 * - 연결 시 초기 상태 즉시 수신
 * - 연결된 클라이언트가 없으면 브로드캐스트 스킵
 */
describe('StatusGateway WebSocket 테스트 (/ws/status)', () => {
  let app: INestApplication;
  let gateway: StatusGateway;
  let connectionServiceMock: {
    getSystemStatus: jest.Mock;
    isSimsConnected: jest.Mock;
    getAllConnections: jest.Mock;
  };

  // 서버와 클라이언트 소켓 모킹
  let mockServer: { emit: jest.Mock };
  let mockClient: { id: string; emit: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    connectionServiceMock = {
      getSystemStatus: jest.fn().mockReturnValue({
        overall: 'HEALTHY',
        simsConnected: true,
        connectedCenters: 5,
        totalCenters: 5,
        connections: [
          { target: { id: 'SIMS', type: 'SIMS' }, status: 'CONNECTED' },
          { target: { id: 'SEOUL', type: 'LOCAL_CENTER' }, status: 'CONNECTED' },
          { target: { id: 'BUSAN', type: 'LOCAL_CENTER' }, status: 'CONNECTED' },
          { target: { id: 'DAEGU', type: 'LOCAL_CENTER' }, status: 'CONNECTED' },
          { target: { id: 'GWANGJU', type: 'LOCAL_CENTER' }, status: 'CONNECTED' },
          { target: { id: 'DAEJEON', type: 'LOCAL_CENTER' }, status: 'CONNECTED' },
        ],
      }),
      isSimsConnected: jest.fn().mockReturnValue(true),
      getAllConnections: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusGateway,
        {
          provide: ConnectionService,
          useValue: connectionServiceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    gateway = module.get<StatusGateway>(StatusGateway);

    // WebSocketServer 모킹
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // 모킹된 클라이언트
    mockClient = { id: 'test-client-001', emit: jest.fn() };
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

      const client2 = { id: 'test-client-002', emit: jest.fn() };
      gateway.handleConnection(client2 as any);
      expect((gateway as any).connectedClients).toBe(2);
    });

    it('클라이언트 연결 시 현재 상태를 즉시 전송해야 한다', () => {
      gateway.handleConnection(mockClient as any);

      // client.emit('status', ...) 호출 확인
      expect(mockClient.emit).toHaveBeenCalledWith('status', expect.objectContaining({
        overall: 'HEALTHY',
        simsConnected: true,
        connectedCenters: 5,
        totalCenters: 5,
      }));
    });

    it('연결 시 ConnectionService.getSystemStatus()가 호출되어야 한다', () => {
      gateway.handleConnection(mockClient as any);

      expect(connectionServiceMock.getSystemStatus).toHaveBeenCalled();
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

    it('다수 클라이언트 중 하나가 해제되어도 나머지에 영향 없어야 한다', () => {
      const client2 = { id: 'test-client-002', emit: jest.fn() };

      gateway.handleConnection(mockClient as any);
      gateway.handleConnection(client2 as any);
      expect((gateway as any).connectedClients).toBe(2);

      gateway.handleDisconnect(mockClient as any);
      expect((gateway as any).connectedClients).toBe(1);
    });
  });

  // ======================================================
  // 시나리오 3: 상태 브로드캐스트 (3초 주기)
  // ======================================================
  describe('상태 브로드캐스트 (3초 주기)', () => {
    it('afterInit 호출 후 3초마다 브로드캐스트가 시작되어야 한다', () => {
      gateway.afterInit();

      // 클라이언트 연결 (브로드캐스트 조건)
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();
      connectionServiceMock.getSystemStatus.mockClear();

      // 3초 경과
      jest.advanceTimersByTime(3000);

      expect(connectionServiceMock.getSystemStatus).toHaveBeenCalled();
      expect(mockServer.emit).toHaveBeenCalledWith('status', expect.objectContaining({
        overall: 'HEALTHY',
      }));
    });

    it('연결된 클라이언트가 없으면 브로드캐스트를 스킵해야 한다', () => {
      gateway.afterInit();

      // 클라이언트 없이 3초 경과
      jest.advanceTimersByTime(3000);

      expect(mockServer.emit).not.toHaveBeenCalled();
    });

    it('상태가 변경되면 새로운 상태가 브로드캐스트되어야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);
      mockServer.emit.mockClear();

      // SIMS 장애 시뮬레이션 - 상태를 CRITICAL로 변경
      connectionServiceMock.getSystemStatus.mockReturnValue({
        overall: 'CRITICAL',
        simsConnected: false,
        connectedCenters: 5,
        totalCenters: 5,
        connections: [],
      });

      jest.advanceTimersByTime(3000);

      expect(mockServer.emit).toHaveBeenCalledWith('status', expect.objectContaining({
        overall: 'CRITICAL',
        simsConnected: false,
      }));
    });
  });

  // ======================================================
  // 시나리오 4: Gateway 정리
  // ======================================================
  describe('Gateway 정리', () => {
    it('onModuleDestroy 호출 시 브로드캐스트 타이머가 정리되어야 한다', () => {
      gateway.afterInit();
      gateway.handleConnection(mockClient as any);

      // 정리
      gateway.onModuleDestroy();

      mockServer.emit.mockClear();

      // 정리 후에는 타이머가 동작하지 않아야 함
      jest.advanceTimersByTime(10000);
      expect(mockServer.emit).not.toHaveBeenCalled();
    });
  });

  // ======================================================
  // 시나리오 5: DEGRADED 상태 브로드캐스트
  // ======================================================
  describe('DEGRADED 상태 브로드캐스트', () => {
    it('일부 집중국 연결 실패 시 DEGRADED 상태가 전송되어야 한다', () => {
      connectionServiceMock.getSystemStatus.mockReturnValue({
        overall: 'DEGRADED',
        simsConnected: true,
        connectedCenters: 3,
        totalCenters: 5,
        connections: [],
      });

      gateway.handleConnection(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith('status', expect.objectContaining({
        overall: 'DEGRADED',
        simsConnected: true,
        connectedCenters: 3,
      }));
    });
  });
});
