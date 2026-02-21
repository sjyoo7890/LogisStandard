import { Test, TestingModule } from '@nestjs/testing';
import { InfoLinkService, SyncJob } from '../../src/info-link/info-link.service';

/**
 * 정보연계(InfoLink) 통합 테스트
 * - SIMS/KPLAS 동기화, 동기화 이력 조회, 우편번호 기반 목적지 조회, 스케줄러 상태
 */
describe('정보연계(InfoLink) 통합 테스트', () => {
  let service: InfoLinkService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [InfoLinkService],
    }).compile();

    service = module.get<InfoLinkService>(InfoLinkService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. SIMS/KPLAS 동기화
  // -------------------------------------------------------
  it('SIMS 및 KPLAS 동기화가 성공적으로 완료되어야 한다', () => {
    // SIMS 동기화
    const simsJob = service.sync('SIMS');
    expect(simsJob.system).toBe('SIMS');
    expect(simsJob.status).toBe('SUCCESS');
    expect(simsJob.recordsSynced).toBe(150);
    expect(simsJob.startedAt).toBeDefined();
    expect(simsJob.completedAt).toBeDefined();
    expect(simsJob.error).toBeUndefined();

    // KPLAS 동기화
    const kplasJob = service.sync('KPLAS');
    expect(kplasJob.system).toBe('KPLAS');
    expect(kplasJob.status).toBe('SUCCESS');
    expect(kplasJob.recordsSynced).toBe(80);
    expect(kplasJob.completedAt).toBeDefined();

    // 이벤트 리스너 동작 확인
    const syncEvents: SyncJob[] = [];
    service.onSyncEvent((job) => syncEvents.push(job));

    service.sync('SIMS');
    expect(syncEvents).toHaveLength(1);
    expect(syncEvents[0].system).toBe('SIMS');
  });

  // -------------------------------------------------------
  // 2. 동기화 이력 조회
  // -------------------------------------------------------
  it('동기화 이력이 시간 역순으로 저장되고 조회 가능해야 한다', () => {
    // 동기화 3회 수행
    service.sync('SIMS');
    service.sync('KPLAS');
    service.sync('SIMS');

    const history = service.getSyncHistory();
    expect(history).toHaveLength(3);
    // 최신 것이 먼저 (unshift)
    expect(history[0].system).toBe('SIMS');
    expect(history[1].system).toBe('KPLAS');
    expect(history[2].system).toBe('SIMS');
    expect(history.every((h) => h.status === 'SUCCESS')).toBe(true);

    // limit 파라미터 테스트
    const limited = service.getSyncHistory(2);
    expect(limited).toHaveLength(2);

    // getStatus에서 동기화 완료 수 확인
    const status = service.getStatus();
    expect(status.syncJobsCompleted).toBe(3);
    expect(status.lastSync).toBeDefined();
  });

  // -------------------------------------------------------
  // 3. 우편번호 기반 목적지 조회
  // -------------------------------------------------------
  it('우편번호로 목적지를 조회할 수 있어야 한다 (정확 매칭 및 접두사 매칭)', () => {
    // 정확한 우편번호 매칭
    const exact = service.lookupDestination('01000');
    expect(exact.found).toBe(true);
    expect(exact.destination).toBeDefined();
    expect(exact.chuteNumber).toBeDefined();
    expect(exact.deliveryPoint).toBeDefined();

    // 정확 매칭이 안 되면 앞 3자리 접두사로 검색
    const prefixMatch = service.lookupDestination('01999');
    expect(prefixMatch.found).toBe(true);
    expect(prefixMatch.destination).toBeDefined();

    // 전혀 매칭되지 않는 우편번호
    const notFound = service.lookupDestination('99999');
    expect(notFound.found).toBe(false);
    expect(notFound.destination).toBeUndefined();
    expect(notFound.chuteNumber).toBeUndefined();

    // 개별 데이터 조회 (getDataByZipCode)
    const record = service.getDataByZipCode('01000');
    expect(record).toBeDefined();
    expect(record!.zipCode).toBe('01000');
    expect(record!.regionCode).toBeDefined();

    // 전체 데이터 조회 (20건)
    const allData = service.getAllData();
    expect(allData).toHaveLength(20);
  });

  // -------------------------------------------------------
  // 4. 스케줄러 상태
  // -------------------------------------------------------
  it('스케줄러 상태가 올바른 간격과 다음 동기화 시간을 포함해야 한다', () => {
    const scheduler = service.getScheduler();

    // 기본 간격 확인
    expect(scheduler.simsInterval).toBe(600000);   // 10분
    expect(scheduler.kplasInterval).toBe(1800000);  // 30분
    expect(scheduler.simsEnabled).toBe(true);
    expect(scheduler.kplasEnabled).toBe(true);

    // 다음 동기화 시간이 설정되어 있어야 함
    expect(scheduler.nextSimsSync).toBeDefined();
    expect(scheduler.nextKplasSync).toBeDefined();

    // SIMS 동기화 수행 후 lastSimsSync 갱신 확인
    service.sync('SIMS');
    const afterSync = service.getScheduler();
    expect(afterSync.lastSimsSync).toBeDefined();
    expect(afterSync.nextSimsSync).toBeDefined();

    // KPLAS 동기화 수행 후 lastKplasSync 갱신 확인
    service.sync('KPLAS');
    const afterKplas = service.getScheduler();
    expect(afterKplas.lastKplasSync).toBeDefined();
    expect(afterKplas.nextKplasSync).toBeDefined();

    // getStatus 종합 확인
    const status = service.getStatus();
    expect(status.totalRecords).toBe(20);
    expect(status.scheduler).toBeDefined();
    expect(status.scheduler.simsEnabled).toBe(true);
  });
});
