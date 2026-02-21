import { Test, TestingModule } from '@nestjs/testing';
import { SortingService, SortEvent } from '../../src/sorting/sorting.service';

/**
 * 시나리오 1-B: 구분 엔진(바코드 처리) 통합 테스트
 * - 바코드→목적지 결정, 미판독 처리, 규칙 없는 우편번호, 이력/통계
 */
describe('구분 엔진 통합 테스트 (시나리오 1)', () => {
  let service: SortingService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SortingService],
    }).compile();

    service = module.get<SortingService>(SortingService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 바코드→목적지 결정 (정상)
  // -------------------------------------------------------
  it('42-prefix 바코드가 올바른 우편번호로 추출되어 SUCCESS 처리되어야 한다', () => {
    // 42XXXXX 형식: 바코드에서 substring(2,7)로 우편번호 추출
    // 4201234... → 우편번호 01234 → 01* 패턴 매칭 → 서울강북, 슈트 1
    const event = service.processBarcode('4201234567890');
    expect(event.result).toBe('SUCCESS');
    expect(event.zipCode).toBe('01234');
    expect(event.destination).toBe('서울강북');
    expect(event.assignedChute).toBe(1);
    expect(event.matchedRuleId).toContain('PLAN-001');
    expect(event.inductionId).toBe('IND-01');

    // 4202000... → 우편번호 02000 → 02* 패턴 → 서울강남, 슈트 2
    const event2 = service.processBarcode('4202000111222', 'IND-02');
    expect(event2.result).toBe('SUCCESS');
    expect(event2.zipCode).toBe('02000');
    expect(event2.destination).toBe('서울강남');
    expect(event2.assignedChute).toBe(2);
    expect(event2.inductionId).toBe('IND-02');
  });

  // -------------------------------------------------------
  // 2. 미판독 바코드 처리
  // -------------------------------------------------------
  it('우편번호를 추출할 수 없는 바코드는 REJECT으로 처리되어야 한다', () => {
    // 42-prefix도 아니고 순수 숫자도 아닌 바코드
    const event = service.processBarcode('INVALID_BARCODE');
    expect(event.result).toBe('REJECT');
    expect(event.zipCode).toBe('UNKNOWN');
    expect(event.destination).toBe('미구분');
    expect(event.assignedChute).toBe(20); // 미구분 슈트

    // 너무 짧은 42-prefix 바코드 (7자리 미만)
    const event2 = service.processBarcode('42');
    expect(event2.result).toBe('REJECT');
    expect(event2.zipCode).toBe('UNKNOWN');
  });

  // -------------------------------------------------------
  // 3. 규칙 없는 우편번호 → REJECT
  // -------------------------------------------------------
  it('매칭되는 규칙이 없는 우편번호는 REJECT으로 처리되어야 한다', () => {
    // 99* 패턴에 해당하는 규칙이 없음
    const event = service.processBarcode('4299999000000');
    expect(event.result).toBe('REJECT');
    expect(event.zipCode).toBe('99999');
    expect(event.destination).toBe('미구분');
    expect(event.assignedChute).toBe(20);
    expect(event.matchedRuleId).toBeUndefined();

    // 5자리 순수 숫자 바코드 (99로 시작, 매칭 규칙 없음)
    const event2 = service.processBarcode('9900000001');
    expect(event2.result).toBe('REJECT');
    expect(event2.zipCode).toBe('99000');
  });

  // -------------------------------------------------------
  // 4. 구분 이력 및 통신 로그
  // -------------------------------------------------------
  it('바코드 처리 후 구분 이력과 통신 로그가 기록되어야 한다', () => {
    // 3개 바코드 처리
    service.processBarcode('4201234000000'); // SUCCESS
    service.processBarcode('4202345000000'); // SUCCESS
    service.processBarcode('INVALID');        // REJECT

    // 구분 이력 확인 (최근 것이 먼저)
    const history = service.getSortHistory();
    expect(history).toHaveLength(3);
    expect(history[0].barcode).toBe('INVALID');
    expect(history[1].barcode).toBe('4202345000000');
    expect(history[2].barcode).toBe('4201234000000');

    // 통신 로그 확인 (PLC 전송 시뮬레이션)
    const commLog = service.getCommLog();
    expect(commLog).toHaveLength(3);
    expect(commLog[0].direction).toBe('SEND');
    expect(commLog[0].messageType).toBe('SORT_COMMAND');
    expect(commLog[0].success).toBe(true);
    expect(commLog[0].target).toContain('PLC-CHUTE-');
  });

  // -------------------------------------------------------
  // 5. 구분 통계 (성공률 계산)
  // -------------------------------------------------------
  it('바코드 처리 결과에 따른 통계가 정확히 집계되어야 한다', () => {
    // 성공 3건, 실패 1건
    service.processBarcode('4201000000000'); // SUCCESS
    service.processBarcode('4202000000000'); // SUCCESS
    service.processBarcode('4203000000000'); // SUCCESS
    service.processBarcode('UNREADABLE');     // REJECT

    const stats = service.getStats();
    expect(stats.totalProcessed).toBe(4);
    expect(stats.successCount).toBe(3);
    expect(stats.rejectCount).toBe(1);
    expect(stats.successRate).toBe(75); // 3/4 * 100 = 75%
    expect(stats.activePlan).toBe('일반우편 구분계획 A');

    // 이벤트 리스너 동작 확인
    const events: SortEvent[] = [];
    service.onSortEvent((event) => events.push(event));

    service.processBarcode('4204000000000');
    expect(events).toHaveLength(1);
    expect(events[0].result).toBe('SUCCESS');
  });
});
