import { Test, TestingModule } from '@nestjs/testing';
import { KeyingService, KeyingRequest } from '../../src/keying/keying.service';

/**
 * 시나리오 2: 타건 (Keying) 통합 테스트
 * - 타건 요청 생성, 타건 완료, 대기 중 요청 조회, 타건 통계
 */
describe('타건(Keying) 통합 테스트 (시나리오 2)', () => {
  let service: KeyingService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [KeyingService],
    }).compile();

    service = module.get<KeyingService>(KeyingService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 타건 요청 생성
  // -------------------------------------------------------
  it('타건 요청을 생성하면 DISPLAYED 상태로 전환되어야 한다', () => {
    // 스테이션 확인 (2개 초기화)
    const stations = service.getAllStations();
    expect(stations).toHaveLength(2);
    expect(stations[0].buttons).toHaveLength(16);

    // 타건 요청 생성
    const request = service.createRequest('4299999000000', 'KST-01');
    expect(request).toBeDefined();
    expect(request.barcode).toBe('4299999000000');
    expect(request.stationId).toBe('KST-01');
    // 시뮬레이션에서 즉시 DISPLAYED로 전환됨
    expect(request.status).toBe('DISPLAYED');
    expect(request.requestedAt).toBeDefined();
    expect(request.displayedAt).toBeDefined();
    expect(request.imageUrl).toBe('/images/mail/4299999000000.jpg');

    // 이벤트 리스너가 호출되는지 확인
    const events: KeyingRequest[] = [];
    service.onKeyingEvent((event) => events.push(event));

    const request2 = service.createRequest('4288888000000', 'KST-02');
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(request2.id);
  });

  // -------------------------------------------------------
  // 2. 타건 완료 (버튼 선택)
  // -------------------------------------------------------
  it('타건 요청을 버튼 선택으로 완료하면 목적지와 슈트가 지정되어야 한다', () => {
    // 타건 요청 생성
    const request = service.createRequest('4201234000000', 'KST-01');

    // 버튼 1번 선택 (서울강북, 슈트 1)
    const completed = service.completeRequest(request.id, 1);
    expect(completed).toBeDefined();
    expect(completed!.status).toBe('COMPLETED');
    expect(completed!.selectedButton).toBe(1);
    expect(completed!.destination).toBe('서울강북');
    expect(completed!.chuteNumber).toBe(1);
    expect(completed!.completedAt).toBeDefined();

    // 스테이션의 processedCount 증가 확인
    const station = service.getStation('KST-01');
    expect(station!.processedCount).toBe(1);
    expect(station!.lastActivity).toBeDefined();

    // 이력 기록 확인
    const history = service.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].requestId).toBe(request.id);
    expect(history[0].destination).toBe('서울강북');
    expect(history[0].processingTimeMs).toBeGreaterThanOrEqual(0);

    // 이미 완료된 요청 재처리 시도
    const duplicate = service.completeRequest(request.id, 2);
    expect(duplicate).toBeUndefined();
  });

  // -------------------------------------------------------
  // 3. 대기 중 요청 조회
  // -------------------------------------------------------
  it('대기 중인 타건 요청을 스테이션별로 필터링하여 조회할 수 있어야 한다', () => {
    // 다수 요청 생성
    service.createRequest('BC-001', 'KST-01');
    service.createRequest('BC-002', 'KST-01');
    service.createRequest('BC-003', 'KST-02');
    const req4 = service.createRequest('BC-004', 'KST-02');

    // 전체 대기 중 요청: 4건 (모두 DISPLAYED 상태)
    const allPending = service.getPendingRequests();
    expect(allPending).toHaveLength(4);

    // KST-01 스테이션 대기 요청: 2건
    const kst01Pending = service.getPendingRequests('KST-01');
    expect(kst01Pending).toHaveLength(2);
    expect(kst01Pending.every((r) => r.stationId === 'KST-01')).toBe(true);

    // KST-02 스테이션 대기 요청: 2건
    const kst02Pending = service.getPendingRequests('KST-02');
    expect(kst02Pending).toHaveLength(2);

    // 하나를 완료하면 대기 요청 수가 줄어듦
    service.completeRequest(req4.id, 5);
    const afterComplete = service.getPendingRequests('KST-02');
    expect(afterComplete).toHaveLength(1);
  });

  // -------------------------------------------------------
  // 4. 타건 통계
  // -------------------------------------------------------
  it('타건 통계가 처리 건수와 대기 건수를 정확히 집계해야 한다', () => {
    // 초기 통계
    const initialStats = service.getStats();
    expect(initialStats.totalStations).toBe(2);
    expect(initialStats.onlineStations).toBe(2);
    expect(initialStats.totalProcessed).toBe(0);
    expect(initialStats.pendingRequests).toBe(0);

    // 3개 요청 생성
    const req1 = service.createRequest('BC-A', 'KST-01');
    const req2 = service.createRequest('BC-B', 'KST-01');
    service.createRequest('BC-C', 'KST-02');

    // 대기 요청 3건
    const midStats = service.getStats();
    expect(midStats.pendingRequests).toBe(3);
    expect(midStats.totalProcessed).toBe(0);

    // 2건 완료
    service.completeRequest(req1.id, 1);
    service.completeRequest(req2.id, 3);

    const finalStats = service.getStats();
    expect(finalStats.totalProcessed).toBe(2);
    expect(finalStats.pendingRequests).toBe(1);
    expect(finalStats.avgProcessingTimeMs).toBeGreaterThanOrEqual(0);

    // getStatus 종합 확인
    const status = service.getStatus();
    expect(status.stations).toBe(2);
    expect(status.stats.totalProcessed).toBe(2);
  });
});
