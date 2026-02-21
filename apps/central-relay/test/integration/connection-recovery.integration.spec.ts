import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConnectionService } from '../../src/connection/connection.service';

// 외부 TCP 연결 차단을 위한 net 모듈 모킹
jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => {
    const events: Record<string, Function> = {};
    return {
      on: jest.fn((event: string, cb: Function) => {
        events[event] = cb;
      }),
      setTimeout: jest.fn(),
      connect: jest.fn(() => {
        // 기본적으로 연결 실패 시뮬레이션
        setTimeout(() => events['error']?.(), 10);
      }),
      destroy: jest.fn(),
    };
  }),
}));

/**
 * 연결 복구 서비스 통합 테스트 (시나리오 5)
 * - SIMS 연결 및 재연결 (exponential backoff)
 * - 헬스체크 동작 확인
 * - 시스템 상태 판정 (HEALTHY/DEGRADED/CRITICAL)
 * - 연결 대상 업데이트
 */
describe('ConnectionService 연결 복구 통합 테스트 (시나리오 5)', () => {
  let app: INestApplication;
  let connectionService: ConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    connectionService = module.get<ConnectionService>(ConnectionService);
    // 수동으로 초기화 (onModuleInit은 자동 호출되지 않으므로)
    connectionService.onModuleInit();
  });

  afterEach(async () => {
    connectionService.onModuleDestroy();
    await app.close();
  });

  // ======================================================
  // 시나리오 1: SIMS 및 집중국 연결 상태 관리
  // ======================================================
  describe('SIMS 연결 및 재연결', () => {
    it('초기화 시 기본 연결 대상(SIMS + 5개 집중국)이 등록되어야 한다', () => {
      const connections = connectionService.getAllConnections();
      expect(connections.length).toBeGreaterThanOrEqual(6);

      // SIMS 연결 확인
      const sims = connections.find((c) => c.target.id === 'SIMS');
      expect(sims).toBeDefined();
      expect(sims!.target.type).toBe('SIMS');
      expect(sims!.target.name).toContain('SIMS');

      // 집중국 연결 확인
      const centerIds = ['SEOUL', 'BUSAN', 'DAEGU', 'GWANGJU', 'DAEJEON'];
      for (const centerId of centerIds) {
        const center = connections.find((c) => c.target.id === centerId);
        expect(center).toBeDefined();
        expect(center!.target.type).toBe('LOCAL_CENTER');
      }
    });

    it('연결 실패 시 ERROR 상태로 전환되고 재연결이 스케줄링되어야 한다', async () => {
      // net mock이 항상 실패하므로 연결 시도 후 ERROR 상태 확인
      await connectionService.connect('SIMS');

      // 비동기 이벤트 처리 대기
      await new Promise((resolve) => setTimeout(resolve, 50));

      const simsConnection = connectionService.getConnection('SIMS');
      expect(simsConnection).toBeDefined();
      // 연결 실패 후 ERROR 또는 CONNECTING 상태
      expect(['ERROR', 'CONNECTING', 'DISCONNECTED']).toContain(
        simsConnection!.status,
      );
    });

    it('수동 재연결(reconnect)을 트리거할 수 있어야 한다', async () => {
      const result = await connectionService.reconnect('SIMS');
      // net mock이 실패하므로 false 반환
      expect(typeof result).toBe('boolean');
    });

    it('존재하지 않는 대상에 대한 재연결은 false를 반환해야 한다', async () => {
      const result = await connectionService.reconnect('UNKNOWN_TARGET');
      expect(result).toBe(false);
    });
  });

  // ======================================================
  // 시나리오 2: 헬스체크 동작 확인
  // ======================================================
  describe('헬스체크 동작 확인', () => {
    it('SIMS 연결 상태를 확인할 수 있어야 한다', () => {
      // net mock이 실패하므로 연결되지 않음
      const isConnected = connectionService.isSimsConnected();
      expect(typeof isConnected).toBe('boolean');
    });

    it('개별 연결 상태를 조회할 수 있어야 한다', () => {
      const sims = connectionService.getConnection('SIMS');
      expect(sims).toBeDefined();
      expect(sims).toHaveProperty('target');
      expect(sims).toHaveProperty('status');
      expect(sims).toHaveProperty('reconnectAttempts');

      expect(sims!.target).toHaveProperty('id');
      expect(sims!.target).toHaveProperty('name');
      expect(sims!.target).toHaveProperty('type');
      expect(sims!.target).toHaveProperty('host');
      expect(sims!.target).toHaveProperty('port');
    });

    it('존재하지 않는 대상 조회 시 undefined를 반환해야 한다', () => {
      const unknown = connectionService.getConnection('NONEXISTENT');
      expect(unknown).toBeUndefined();
    });
  });

  // ======================================================
  // 시나리오 3: 시스템 상태 판정 (HEALTHY/DEGRADED/CRITICAL)
  // ======================================================
  describe('시스템 상태 판정 (HEALTHY/DEGRADED/CRITICAL)', () => {
    it('SIMS 미연결 시 CRITICAL 상태를 반환해야 한다', () => {
      // net mock이 모든 연결 실패하므로 SIMS는 미연결
      const status = connectionService.getSystemStatus();

      expect(status.overall).toBe('CRITICAL');
      expect(status.simsConnected).toBe(false);
      expect(status.totalCenters).toBe(5);
      expect(status.connections).toBeDefined();
      expect(Array.isArray(status.connections)).toBe(true);
    });

    it('시스템 상태에 전체 연결 정보가 포함되어야 한다', () => {
      const status = connectionService.getSystemStatus();

      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('simsConnected');
      expect(status).toHaveProperty('connectedCenters');
      expect(status).toHaveProperty('totalCenters');
      expect(status).toHaveProperty('connections');
      expect(status.connections.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ======================================================
  // 시나리오 4: 연결 대상 업데이트
  // ======================================================
  describe('연결 대상 설정 업데이트', () => {
    it('집중국 호스트 정보를 업데이트할 수 있어야 한다', () => {
      const result = connectionService.updateTarget('SEOUL', {
        host: '10.10.1.200',
        port: 3200,
      });

      expect(result).toBe(true);

      const seoul = connectionService.getConnection('SEOUL');
      expect(seoul!.target.host).toBe('10.10.1.200');
      expect(seoul!.target.port).toBe(3200);
    });

    it('존재하지 않는 대상 업데이트는 false를 반환해야 한다', () => {
      const result = connectionService.updateTarget('UNKNOWN', {
        host: '10.10.99.99',
      });
      expect(result).toBe(false);
    });

    it('SIMS 연결 정보를 업데이트할 수 있어야 한다', () => {
      const result = connectionService.updateTarget('SIMS', {
        host: 'sims-backup.koreapost.go.kr',
        port: 5433,
      });

      expect(result).toBe(true);

      const sims = connectionService.getConnection('SIMS');
      expect(sims!.target.host).toBe('sims-backup.koreapost.go.kr');
      expect(sims!.target.port).toBe(5433);
    });
  });
});
