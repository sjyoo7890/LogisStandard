import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RelayConfigService } from '../../src/config/relay-config.service';

/**
 * 중앙 중계기 설정 관리 서비스 통합 테스트
 * - 전체 설정 조회
 * - 설정 업데이트 (SIMS, 프로토콜, 동기화 주기)
 * - 센터별 설정 CRUD
 * - SIMS 설정 조회
 */
describe('RelayConfigService 설정 관리 통합 테스트', () => {
  let app: INestApplication;
  let configService: RelayConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayConfigService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    configService = module.get<RelayConfigService>(RelayConfigService);
  });

  afterEach(async () => {
    await app.close();
  });

  // ======================================================
  // 시나리오 1: 전체 설정 조회
  // ======================================================
  describe('전체 설정 조회', () => {
    it('기본 설정이 모든 필수 섹션을 포함해야 한다', () => {
      const config = configService.getConfig();

      expect(config).toHaveProperty('sims');
      expect(config).toHaveProperty('centers');
      expect(config).toHaveProperty('protocol');
      expect(config).toHaveProperty('sync');
    });

    it('기본 SIMS 설정이 올바른 구조를 가져야 한다', () => {
      const config = configService.getConfig();

      expect(config.sims).toHaveProperty('host');
      expect(config.sims).toHaveProperty('port');
      expect(config.sims).toHaveProperty('databaseUrl');
      expect(config.sims).toHaveProperty('heartbeatIntervalMs');
      expect(config.sims).toHaveProperty('timeoutMs');
      expect(config.sims.port).toBe(5432);
    });

    it('기본 센터 목록에 5개 집중국이 포함되어야 한다', () => {
      const config = configService.getConfig();

      expect(config.centers.length).toBe(5);
      const centerIds = config.centers.map((c) => c.centerId);
      expect(centerIds).toContain('SEOUL');
      expect(centerIds).toContain('BUSAN');
      expect(centerIds).toContain('DAEGU');
      expect(centerIds).toContain('GWANGJU');
      expect(centerIds).toContain('DAEJEON');
    });

    it('프로토콜 설정에 db2db, ftp, socket 섹션이 있어야 한다', () => {
      const config = configService.getConfig();

      expect(config.protocol).toHaveProperty('db2db');
      expect(config.protocol).toHaveProperty('ftp');
      expect(config.protocol).toHaveProperty('socket');

      expect(config.protocol.db2db.batchSize).toBe(100);
      expect(config.protocol.ftp.maxConcurrentTransfers).toBe(3);
      expect(config.protocol.socket.maxConnections).toBe(50);
    });
  });

  // ======================================================
  // 시나리오 2: 설정 업데이트
  // ======================================================
  describe('설정 업데이트', () => {
    it('SIMS 설정을 부분 업데이트할 수 있어야 한다', () => {
      const updated = configService.updateConfig({
        sims: {
          host: 'sims-new.koreapost.go.kr',
          port: 5433,
          databaseUrl: 'postgresql://new-host:5433/sims',
          heartbeatIntervalMs: 5000,
          timeoutMs: 3000,
        },
      });

      expect(updated.sims.host).toBe('sims-new.koreapost.go.kr');
      expect(updated.sims.port).toBe(5433);
      expect(updated.sims.heartbeatIntervalMs).toBe(5000);
    });

    it('프로토콜 설정을 업데이트할 수 있어야 한다', () => {
      const updated = configService.updateConfig({
        protocol: {
          db2db: { batchSize: 200, pollIntervalMs: 2000, retryAttempts: 5 },
          ftp: { maxConcurrentTransfers: 5, retryAttempts: 5, timeoutMs: 600000 },
          socket: { maxConnections: 100, keepAliveMs: 60000 },
        },
      });

      expect(updated.protocol.db2db.batchSize).toBe(200);
      expect(updated.protocol.ftp.maxConcurrentTransfers).toBe(5);
      expect(updated.protocol.socket.maxConnections).toBe(100);
    });

    it('동기화 주기 설정을 업데이트할 수 있어야 한다', () => {
      const updated = configService.updateConfig({
        sync: {
          receptionInfo: { intervalMs: 120000, batchSize: 200 },
          addressRouteDB: { intervalMs: 7200000, batchSize: 1000 },
          sortingResult: { intervalMs: 60000, batchSize: 200 },
          bindingInfo: { intervalMs: 60000, batchSize: 200 },
          statistics: { intervalMs: 1200000, batchSize: 100 },
        },
      });

      expect(updated.sync.receptionInfo.intervalMs).toBe(120000);
      expect(updated.sync.addressRouteDB.batchSize).toBe(1000);
      expect(updated.sync.sortingResult.intervalMs).toBe(60000);
    });
  });

  // ======================================================
  // 시나리오 3: 센터별 설정 CRUD
  // ======================================================
  describe('센터별 설정 CRUD', () => {
    it('특정 집중국 설정을 조회할 수 있어야 한다', () => {
      const seoulConfig = configService.getCenterConfig('SEOUL');

      expect(seoulConfig).toBeDefined();
      expect(seoulConfig!.centerId).toBe('SEOUL');
      expect(seoulConfig!.centerName).toBe('서울우편집중국');
      expect(seoulConfig!.host).toBe('10.10.1.100');
      expect(seoulConfig!.port).toBe(3100);
      expect(seoulConfig!.protocol).toBe('TCP_SOCKET');
      expect(seoulConfig!.enabled).toBe(true);
    });

    it('존재하지 않는 집중국 조회 시 undefined를 반환해야 한다', () => {
      const unknown = configService.getCenterConfig('UNKNOWN');
      expect(unknown).toBeUndefined();
    });

    it('집중국 설정을 업데이트할 수 있어야 한다', () => {
      const updated = configService.updateCenterConfig('BUSAN', {
        host: '10.10.2.200',
        port: 3200,
        syncIntervalMs: 60000,
        enabled: false,
      });

      expect(updated).not.toBeNull();
      expect(updated!.host).toBe('10.10.2.200');
      expect(updated!.port).toBe(3200);
      expect(updated!.syncIntervalMs).toBe(60000);
      expect(updated!.enabled).toBe(false);

      // 업데이트가 실제로 반영되었는지 확인
      const verified = configService.getCenterConfig('BUSAN');
      expect(verified!.host).toBe('10.10.2.200');
    });

    it('존재하지 않는 집중국 업데이트 시 null을 반환해야 한다', () => {
      const result = configService.updateCenterConfig('NONEXISTENT', {
        host: '10.10.99.99',
      });
      expect(result).toBeNull();
    });

    it('활성화된 집중국 목록을 조회할 수 있어야 한다', () => {
      const activeCenters = configService.getActiveCenters();
      expect(activeCenters.length).toBe(5);
      activeCenters.forEach((center) => {
        expect(center.enabled).toBe(true);
      });

      // 하나를 비활성화한 후 확인
      configService.updateCenterConfig('DAEJEON', { enabled: false });
      const updatedActive = configService.getActiveCenters();
      expect(updatedActive.length).toBe(4);
      expect(updatedActive.find((c) => c.centerId === 'DAEJEON')).toBeUndefined();
    });
  });

  // ======================================================
  // 시나리오 4: SIMS 설정 조회
  // ======================================================
  describe('SIMS 설정 조회', () => {
    it('SIMS 설정을 독립적으로 조회할 수 있어야 한다', () => {
      const simsConfig = configService.getSimsConfig();

      expect(simsConfig).toHaveProperty('host');
      expect(simsConfig).toHaveProperty('port');
      expect(simsConfig).toHaveProperty('databaseUrl');
      expect(simsConfig).toHaveProperty('heartbeatIntervalMs');
      expect(simsConfig).toHaveProperty('timeoutMs');
      expect(simsConfig.port).toBe(5432);
      expect(simsConfig.heartbeatIntervalMs).toBe(10000);
      expect(simsConfig.timeoutMs).toBe(5000);
    });

    it('SIMS 설정 업데이트 후 변경된 값을 반환해야 한다', () => {
      configService.updateConfig({
        sims: {
          host: 'sims-dr.koreapost.go.kr',
          port: 5434,
          databaseUrl: 'postgresql://dr-host:5434/sims',
          heartbeatIntervalMs: 15000,
          timeoutMs: 10000,
        },
      });

      const simsConfig = configService.getSimsConfig();
      expect(simsConfig.host).toBe('sims-dr.koreapost.go.kr');
      expect(simsConfig.port).toBe(5434);
      expect(simsConfig.heartbeatIntervalMs).toBe(15000);
      expect(simsConfig.timeoutMs).toBe(10000);
    });
  });
});
