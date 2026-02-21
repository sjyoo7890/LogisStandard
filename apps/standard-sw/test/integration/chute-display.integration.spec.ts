import { Test, TestingModule } from '@nestjs/testing';
import { ChuteDisplayService, ChuteDisplayEntry } from '../../src/chute-display/chute-display.service';

/**
 * 슈트표시(ChuteDisplay) 통합 테스트
 * - 슈트 표시 조회, 구분계획 적용, 카운트 증가/리셋, 요약 통계
 */
describe('슈트표시(ChuteDisplay) 통합 테스트', () => {
  let service: ChuteDisplayService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ChuteDisplayService],
    }).compile();

    service = module.get<ChuteDisplayService>(ChuteDisplayService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 슈트 표시 조회
  // -------------------------------------------------------
  it('20개 슈트의 표시 정보가 올바르게 초기화되어야 한다', () => {
    const allDisplays = service.getAllDisplays();
    expect(allDisplays).toHaveLength(20);

    // 모든 슈트의 기본 속성 검증
    for (const display of allDisplays) {
      expect(display.chuteNumber).toBeGreaterThanOrEqual(1);
      expect(display.chuteNumber).toBeLessThanOrEqual(20);
      expect(display.destination).toBeDefined();
      expect(display.capacity).toBe(200);
      expect(display.currentCount).toBeGreaterThanOrEqual(0);
      expect(display.fillRate).toBeGreaterThanOrEqual(0);
      expect(display.lastUpdated).toBeDefined();
      expect(['NORMAL', 'NEAR_FULL', 'FULL', 'EMPTY', 'DISABLED']).toContain(display.status);
    }

    // 개별 슈트 조회
    const chute1 = service.getDisplay(1);
    expect(chute1).toBeDefined();
    expect(chute1!.destination).toBe('서울강북');

    const chute20 = service.getDisplay(20);
    expect(chute20).toBeDefined();
    expect(chute20!.destination).toBe('미구분');

    // 존재하지 않는 슈트 조회
    const nonExistent = service.getDisplay(999);
    expect(nonExistent).toBeUndefined();
  });

  // -------------------------------------------------------
  // 2. 구분계획 적용 (일괄 매핑)
  // -------------------------------------------------------
  it('구분계획 매핑을 적용하면 해당 슈트의 목적지와 카운트가 초기화되어야 한다', () => {
    // 매핑 정의
    const mappings = [
      { chuteNumber: 1, destination: '테스트-A' },
      { chuteNumber: 2, destination: '테스트-B' },
      { chuteNumber: 3, destination: '테스트-C' },
    ];

    // 이벤트 리스너 설정
    const displayChanges: ChuteDisplayEntry[] = [];
    service.onDisplayChange((entry) => displayChanges.push(entry));

    const result = service.applyPlan(mappings);
    expect(result.applied).toBe(3);
    expect(result.total).toBe(3);

    // 적용된 슈트 확인
    const chute1 = service.getDisplay(1);
    expect(chute1!.destination).toBe('테스트-A');
    expect(chute1!.currentCount).toBe(0);
    expect(chute1!.fillRate).toBe(0);
    expect(chute1!.status).toBe('EMPTY');

    const chute2 = service.getDisplay(2);
    expect(chute2!.destination).toBe('테스트-B');

    // 이벤트가 3번 발생
    expect(displayChanges).toHaveLength(3);

    // 존재하지 않는 슈트가 포함된 매핑
    const partialMappings = [
      { chuteNumber: 1, destination: '재변경' },
      { chuteNumber: 999, destination: '존재안함' },
    ];
    const partialResult = service.applyPlan(partialMappings);
    expect(partialResult.applied).toBe(1);
    expect(partialResult.total).toBe(2);
  });

  // -------------------------------------------------------
  // 3. 카운트 증가 및 리셋
  // -------------------------------------------------------
  it('슈트 카운트 증가 시 상태가 올바르게 전환되어야 한다', () => {
    // 슈트 1번 리셋 후 증가 테스트
    service.resetChute(1);
    const reset = service.getDisplay(1);
    expect(reset!.currentCount).toBe(0);
    expect(reset!.status).toBe('EMPTY');

    // 1건 증가
    const after1 = service.incrementCount(1);
    expect(after1).toBeDefined();
    expect(after1!.currentCount).toBe(1);
    expect(after1!.fillRate).toBe(1); // 1/200 * 100 = 0.5 → round = 1
    expect(after1!.status).toBe('NORMAL');

    // 159건 더 증가 (총 160건 → 80%)
    for (let i = 0; i < 159; i++) {
      service.incrementCount(1);
    }
    const at160 = service.getDisplay(1);
    expect(at160!.currentCount).toBe(160);
    expect(at160!.fillRate).toBe(80); // 160/200 * 100 = 80
    expect(at160!.status).toBe('NEAR_FULL');

    // 40건 더 증가 (총 200건 → 100%)
    for (let i = 0; i < 40; i++) {
      service.incrementCount(1);
    }
    const at200 = service.getDisplay(1);
    expect(at200!.currentCount).toBe(200);
    expect(at200!.status).toBe('FULL');

    // 리셋
    const resetResult = service.resetChute(1);
    expect(resetResult).toBe(true);
    const afterReset = service.getDisplay(1);
    expect(afterReset!.currentCount).toBe(0);
    expect(afterReset!.status).toBe('EMPTY');

    // 존재하지 않는 슈트 조작
    expect(service.incrementCount(999)).toBeUndefined();
    expect(service.resetChute(999)).toBe(false);
  });

  // -------------------------------------------------------
  // 4. 요약 통계
  // -------------------------------------------------------
  it('슈트 요약 통계가 상태별 카운트를 올바르게 집계해야 한다', () => {
    // 모든 슈트 리셋 후 특정 상태로 설정
    for (let i = 1; i <= 20; i++) {
      service.resetChute(i);
    }

    // 초기 상태: 모두 EMPTY
    const initialSummary = service.getSummary();
    expect(initialSummary.totalChutes).toBe(20);
    expect(initialSummary.empty).toBe(20);
    expect(initialSummary.totalItems).toBe(0);

    // 슈트 1에 50개 투입 → NORMAL
    for (let i = 0; i < 50; i++) {
      service.incrementCount(1);
    }

    // 슈트 2에 170개 투입 → NEAR_FULL (170/200 = 85%)
    for (let i = 0; i < 170; i++) {
      service.incrementCount(2);
    }

    const midSummary = service.getSummary();
    expect(midSummary.totalChutes).toBe(20);
    expect(midSummary.normal).toBeGreaterThanOrEqual(1);
    expect(midSummary.nearFull).toBeGreaterThanOrEqual(1);
    expect(midSummary.empty).toBe(18);
    expect(midSummary.totalItems).toBe(220); // 50 + 170

    // getStatus는 getSummary와 동일
    const status = service.getStatus();
    expect(status.totalChutes).toBe(20);
    expect(status.totalItems).toBe(220);
  });
});
