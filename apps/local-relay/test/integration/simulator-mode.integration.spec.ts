import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorService } from '../../src/simulator/simulator.service';

/**
 * 시뮬레이터 모드 통합 테스트 (시나리오 4)
 * - 시뮬레이터 시작/중지
 * - 구분 규칙 설정
 * - 가상 우편물 생성
 * - 시뮬레이션 결과 검증
 * - 통계 확인
 */
describe('시뮬레이터 모드(Simulator Mode) 통합 테스트', () => {
  let service: SimulatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulatorService],
    }).compile();

    service = module.get<SimulatorService>(SimulatorService);
  });

  afterEach(() => {
    service.reset();
  });

  // 테스트 1: 시뮬레이터 시작/중지 라이프사이클
  it('시뮬레이터를 시작하고 중지하는 전체 라이프사이클이 정상 동작해야 한다', () => {
    // 초기 상태
    expect(service.isRunning()).toBe(false);
    expect(service.getStats().running).toBe(false);

    // 시작
    const started = service.start(5000); // 5초 간격 (테스트에서는 자동 생성 방지)
    expect(started).toBe(true);
    expect(service.isRunning()).toBe(true);
    expect(service.getStats().startedAt).toBeDefined();

    // 중복 시작 방지
    expect(service.start()).toBe(false);

    // 중지
    const stopped = service.stop();
    expect(stopped).toBe(true);
    expect(service.isRunning()).toBe(false);

    // 중복 중지 방지
    expect(service.stop()).toBe(false);

    // 리셋
    service.simulateOne('42012345'); // 데이터 생성
    expect(service.getItems().length).toBe(1);
    service.reset();
    expect(service.getItems().length).toBe(0);
    expect(service.isRunning()).toBe(false);
  });

  // 테스트 2: 구분 규칙 설정 및 적용
  it('4가지 구분 규칙이 올바르게 적용되어야 한다', () => {
    // 사용 가능한 규칙 확인
    const rules = service.getRules();
    expect(rules.length).toBe(4);
    expect(rules.map((r) => r.rule)).toEqual(['ODD_EVEN', 'DIVISIBLE', 'RANGE', 'MODULO']);

    // ODD_EVEN 규칙 (기본값)
    expect(service.getActiveRule().rule).toBe('ODD_EVEN');
    const oddItem = service.simulateOne('42011', '42011'); // 홀수
    expect(oddItem.assignedChute).toBe(1); // oddChute

    const evenItem = service.simulateOne('42012', '42012'); // 짝수
    expect(evenItem.assignedChute).toBe(2); // evenChute

    // MODULO 규칙으로 변경
    expect(service.setRule('MODULO')).toBe(true);
    expect(service.getActiveRule().rule).toBe('MODULO');
    const moduloItem = service.simulateOne('42012345');
    expect(moduloItem.result).toBe('SUCCESS');
    // MODULO 규칙: pid % 10 + 1
    expect(moduloItem.assignedChute).toBeGreaterThanOrEqual(1);
    expect(moduloItem.assignedChute).toBeLessThanOrEqual(10);

    // 잘못된 규칙 설정 실패
    expect(service.setRule('INVALID' as any)).toBe(false);
  });

  // 테스트 3: 가상 우편물 단건 생성 및 결과 확인
  it('가상 우편물 단건 시뮬레이션이 올바른 결과를 반환해야 한다', () => {
    // 정상 바코드 시뮬레이션
    const item1 = service.simulateOne('4201234567890');
    expect(item1.pid).toBeGreaterThan(100000);
    expect(item1.barcode).toBe('4201234567890');
    expect(item1.sortCode).toBe('42012');
    expect(item1.inductionNo).toBeGreaterThanOrEqual(1);
    expect(item1.inductionNo).toBeLessThanOrEqual(4);
    expect(item1.rule).toBe('ODD_EVEN');
    expect(item1.timestamp).toBeDefined();

    // NO_READ 시뮬레이션 (빈 바코드)
    const noReadItem = service.simulateOne('');
    expect(noReadItem.result).toBe('NO_READ');
    expect(noReadItem.assignedChute).toBe(0);
    expect(noReadItem.barcode).toBe('');

    // 아이템 목록 확인
    const items = service.getItems();
    expect(items.length).toBe(2);
    // 최신 항목이 먼저
    expect(items[0].result).toBe('NO_READ');
    expect(items[1].barcode).toBe('4201234567890');
  });

  // 테스트 4: 시뮬레이션 결과 검증 (기준값 대비 실제값 비교)
  it('기준값과 실제값 비교 검증이 정확해야 한다', () => {
    // ODD_EVEN 규칙으로 시뮬레이션
    const item1 = service.simulateOne('42011', '42011'); // 홀수 → 슈트1
    expect(item1.assignedChute).toBe(1);

    // 검증: 기준값 = 실제값 → match
    const verifyMatch = service.verify(1, item1.assignedChute, item1.barcode);
    expect(verifyMatch.match).toBe(true);
    expect(verifyMatch.expected).toBe(1);
    expect(verifyMatch.actual).toBe(1);

    // 검증: 기준값 ≠ 실제값 → mismatch
    const verifyMismatch = service.verify(5, item1.assignedChute, item1.barcode);
    expect(verifyMismatch.match).toBe(false);
    expect(verifyMismatch.expected).toBe(5);
    expect(verifyMismatch.actual).toBe(1);

    // 짝수 바코드 검증
    const item2 = service.simulateOne('42012', '42012'); // 짝수 → 슈트2
    expect(item2.assignedChute).toBe(2);
    const verifyEven = service.verify(2, item2.assignedChute, item2.barcode);
    expect(verifyEven.match).toBe(true);
  });

  // 테스트 5: 시뮬레이션 통계 확인
  it('시뮬레이션 통계가 정확하게 집계되어야 한다', () => {
    // 초기 통계
    let stats = service.getStats();
    expect(stats.totalItems).toBe(0);
    expect(stats.successCount).toBe(0);
    expect(stats.rejectCount).toBe(0);
    expect(stats.noReadCount).toBe(0);
    expect(stats.running).toBe(false);

    // 10건 시뮬레이션: 다양한 결과
    // ODD_EVEN 규칙에서는 바코드가 있으면 SUCCESS
    for (let i = 0; i < 7; i++) {
      service.simulateOne(`4201${String(i).padStart(9, '0')}0`);
    }
    // NO_READ 3건
    for (let i = 0; i < 3; i++) {
      service.simulateOne('');
    }

    stats = service.getStats();
    expect(stats.totalItems).toBe(10);
    expect(stats.successCount).toBe(7);
    expect(stats.noReadCount).toBe(3);
    expect(stats.running).toBe(false);

    // 아이템 목록 제한
    const limitedItems = service.getItems(5);
    expect(limitedItems.length).toBe(5);

    const allItems = service.getItems(100);
    expect(allItems.length).toBe(10);
  });
});
