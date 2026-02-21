import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSyncService } from '../../src/data-sync/data-sync.service';
import { ConnectionService } from '../../src/connection/connection.service';

/**
 * 데이터 동기화 서비스 통합 테스트
 * - 접수정보 동기화 (Inbound/Outbound)
 * - 수동 동기화 트리거
 * - 동기화 이력 조회 및 필터링
 * - 동기화 상태 요약 확인
 */
describe('DataSyncService 통합 테스트', () => {
  let app: INestApplication;
  let dataSyncService: DataSyncService;
  let connectionService: jest.Mocked<ConnectionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSyncService,
        {
          provide: ConnectionService,
          useValue: {
            isSimsConnected: jest.fn().mockReturnValue(true),
            getAllConnections: jest.fn().mockReturnValue([]),
            getSystemStatus: jest.fn().mockReturnValue({
              overall: 'HEALTHY',
              simsConnected: true,
              connectedCenters: 5,
              totalCenters: 5,
              connections: [],
            }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dataSyncService = module.get<DataSyncService>(DataSyncService);
    connectionService = module.get(ConnectionService);
  });

  afterEach(async () => {
    await app.close();
  });

  // ======================================================
  // 시나리오 1: 접수정보 Inbound 동기화 (SIMS -> 집중국)
  // ======================================================
  describe('접수정보 Inbound 동기화 (SIMS -> 집중국)', () => {
    it('SIMS에서 집중국으로 접수정보를 동기화해야 한다', async () => {
      // SIMS 연결 상태 정상
      connectionService.isSimsConnected.mockReturnValue(true);

      const job = await dataSyncService.executeSyncJob(
        'SIMS_TO_CENTER',
        'RECEPTION_INFO',
      );

      expect(job).toBeDefined();
      expect(job.direction).toBe('SIMS_TO_CENTER');
      expect(job.syncType).toBe('RECEPTION_INFO');
      expect(job.status).toBe('COMPLETED');
      expect(job.targetId).toBe('ALL_CENTERS');
      expect(job.startedAt).toBeDefined();
      expect(job.completedAt).toBeDefined();
      expect(job.jobId).toMatch(/^SYNC_/);
    });

    it('SIMS에서 집중국으로 주소/순로DB를 동기화해야 한다', async () => {
      connectionService.isSimsConnected.mockReturnValue(true);

      const job = await dataSyncService.executeSyncJob(
        'SIMS_TO_CENTER',
        'ADDRESS_ROUTE_DB',
      );

      expect(job.direction).toBe('SIMS_TO_CENTER');
      expect(job.syncType).toBe('ADDRESS_ROUTE_DB');
      expect(job.status).toBe('COMPLETED');
    });
  });

  // ======================================================
  // 시나리오 2: Outbound 동기화 (집중국 -> SIMS)
  // ======================================================
  describe('Outbound 동기화 (집중국 -> SIMS)', () => {
    it('집중국에서 SIMS로 구분결과를 동기화해야 한다', async () => {
      const job = await dataSyncService.executeSyncJob(
        'CENTER_TO_SIMS',
        'SORTING_RESULT',
      );

      expect(job.direction).toBe('CENTER_TO_SIMS');
      expect(job.syncType).toBe('SORTING_RESULT');
      expect(job.status).toBe('COMPLETED');
      expect(job.targetId).toBe('SIMS');
    });

    it('집중국에서 SIMS로 체결정보 및 통계를 동기화해야 한다', async () => {
      const bindingJob = await dataSyncService.executeSyncJob(
        'CENTER_TO_SIMS',
        'BINDING_INFO',
      );
      const statsJob = await dataSyncService.executeSyncJob(
        'CENTER_TO_SIMS',
        'STATISTICS',
      );

      expect(bindingJob.syncType).toBe('BINDING_INFO');
      expect(bindingJob.status).toBe('COMPLETED');

      expect(statsJob.syncType).toBe('STATISTICS');
      expect(statsJob.status).toBe('COMPLETED');
    });
  });

  // ======================================================
  // 시나리오 3: 수동 동기화 트리거
  // ======================================================
  describe('수동 동기화 트리거', () => {
    it('특정 집중국 대상으로 수동 동기화를 실행해야 한다', async () => {
      const job = await dataSyncService.triggerManualSync(
        'SIMS_TO_CENTER',
        'ADDRESS_ROUTE_DB',
        'SEOUL',
      );

      expect(job).toBeDefined();
      expect(job.targetId).toBe('SEOUL');
      expect(job.direction).toBe('SIMS_TO_CENTER');
      expect(job.syncType).toBe('ADDRESS_ROUTE_DB');
      expect(job.status).toBe('COMPLETED');
    });
  });

  // ======================================================
  // 시나리오 4: 동기화 이력 조회 및 필터링
  // ======================================================
  describe('동기화 이력 조회 및 필터링', () => {
    it('실행된 동기화 작업의 이력을 조회해야 한다', async () => {
      // 여러 동기화 작업 실행
      await dataSyncService.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'BINDING_INFO');

      const history = dataSyncService.getSyncHistory();
      expect(history.length).toBe(3);

      // 이력 항목의 구조 검증
      const entry = history[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('jobId');
      expect(entry).toHaveProperty('direction');
      expect(entry).toHaveProperty('syncType');
      expect(entry).toHaveProperty('duration');
      expect(entry).toHaveProperty('startedAt');
      expect(entry).toHaveProperty('completedAt');
    });

    it('방향(direction) 필터를 적용하여 이력을 조회해야 한다', async () => {
      await dataSyncService.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'BINDING_INFO');

      const inboundHistory = dataSyncService.getSyncHistory({
        direction: 'SIMS_TO_CENTER',
      });
      expect(inboundHistory.length).toBe(1);
      expect(inboundHistory[0].direction).toBe('SIMS_TO_CENTER');

      const outboundHistory = dataSyncService.getSyncHistory({
        direction: 'CENTER_TO_SIMS',
      });
      expect(outboundHistory.length).toBe(2);
      outboundHistory.forEach((h) => {
        expect(h.direction).toBe('CENTER_TO_SIMS');
      });
    });

    it('syncType 필터를 적용하여 이력을 조회해야 한다', async () => {
      await dataSyncService.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
      await dataSyncService.executeSyncJob('SIMS_TO_CENTER', 'ADDRESS_ROUTE_DB');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');

      const receptionOnly = dataSyncService.getSyncHistory({
        syncType: 'RECEPTION_INFO',
      });
      expect(receptionOnly.length).toBe(1);
      expect(receptionOnly[0].syncType).toBe('RECEPTION_INFO');
    });
  });

  // ======================================================
  // 시나리오 5: 동기화 상태 요약 확인
  // ======================================================
  describe('동기화 상태 요약 확인', () => {
    it('현재 동기화 상태 요약을 반환해야 한다', async () => {
      await dataSyncService.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
      await dataSyncService.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');

      const status = dataSyncService.getSyncStatus();

      expect(status.currentJobs).toBe(0); // 모두 완료됨
      expect(status.totalCompleted).toBe(2);
      expect(status.totalFailed).toBe(0);
      expect(status.lastSyncTimes).toHaveProperty('RECEPTION_INFO');
      expect(status.lastSyncTimes).toHaveProperty('SORTING_RESULT');
      expect(status.lastSyncTimes.RECEPTION_INFO).toBeDefined();
      expect(status.lastSyncTimes.SORTING_RESULT).toBeDefined();
    });

    it('진행 중인 작업이 없을 때 빈 배열을 반환해야 한다', () => {
      const currentJobs = dataSyncService.getCurrentJobs();
      expect(currentJobs).toEqual([]);
    });
  });
});
