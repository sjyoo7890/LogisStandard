import { Test, TestingModule } from '@nestjs/testing';
import { SortingService } from '../../src/sorting/sorting.service';

/**
 * 시나리오 1-A: 구분계획 관리 통합 테스트
 * - 구분계획 CRUD, 활성화, 규칙 매칭, 활성 계획 조회
 */
describe('구분계획 관리 통합 테스트 (시나리오 1)', () => {
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
  // 1. 구분계획 CRUD
  // -------------------------------------------------------
  it('초기 구분계획 2개가 생성되어야 한다', () => {
    // 2개의 기본 플랜이 초기화 시 생성됨
    const plans = service.getAllPlans();
    expect(plans).toHaveLength(2);

    const plan001 = service.getPlan('PLAN-001');
    expect(plan001).toBeDefined();
    expect(plan001!.name).toBe('일반우편 구분계획 A');
    expect(plan001!.rules).toHaveLength(10);

    const plan002 = service.getPlan('PLAN-002');
    expect(plan002).toBeDefined();
    expect(plan002!.name).toBe('등기우편 구분계획 B');
    expect(plan002!.rules).toHaveLength(10);
  });

  it('신규 구분계획을 생성하면 DRAFT 상태이며 규칙이 비어있어야 한다', () => {
    // 신규 계획 생성 후 상태 및 규칙 수 확인
    const newPlan = service.createPlan('테스트 구분계획 C');
    expect(newPlan.status).toBe('DRAFT');
    expect(newPlan.name).toBe('테스트 구분계획 C');
    expect(newPlan.rules).toHaveLength(0);
    expect(newPlan.id).toBeDefined();
    expect(newPlan.createdAt).toBeDefined();

    // 전체 계획 목록에서도 확인
    const allPlans = service.getAllPlans();
    expect(allPlans).toHaveLength(3);
    expect(allPlans.find((p) => p.id === newPlan.id)).toBeDefined();
  });

  // -------------------------------------------------------
  // 2. 구분계획 활성화
  // -------------------------------------------------------
  it('DRAFT 계획을 활성화하면 기존 ACTIVE 계획이 ARCHIVED로 변경되어야 한다', () => {
    // 현재 PLAN-001이 ACTIVE, PLAN-002가 DRAFT
    const beforeActive = service.getActivePlan();
    expect(beforeActive!.id).toBe('PLAN-001');

    // PLAN-002 활성화
    const result = service.activatePlan('PLAN-002');
    expect(result).toBe(true);

    // PLAN-002가 ACTIVE, PLAN-001이 ARCHIVED
    const afterActive = service.getActivePlan();
    expect(afterActive!.id).toBe('PLAN-002');
    expect(afterActive!.status).toBe('ACTIVE');

    const archivedPlan = service.getPlan('PLAN-001');
    expect(archivedPlan!.status).toBe('ARCHIVED');
  });

  // -------------------------------------------------------
  // 3. 구분규칙 매칭 (각 플랜별 10개 규칙)
  // -------------------------------------------------------
  it('활성 계획의 규칙이 우편번호 패턴과 올바르게 매칭되어야 한다', () => {
    const activePlan = service.getActivePlan();
    expect(activePlan).toBeDefined();
    expect(activePlan!.rules).toHaveLength(10);

    // 01* 패턴 → 서울강북 (슈트 1)
    const rule01 = activePlan!.rules.find((r) => r.zipCodePattern === '01*');
    expect(rule01).toBeDefined();
    expect(rule01!.destination).toBe('서울강북');
    expect(rule01!.destinationChute).toBe(1);

    // 4* 패턴 → 전라/경상 (슈트 10)
    const rule4 = activePlan!.rules.find((r) => r.zipCodePattern === '4*');
    expect(rule4).toBeDefined();
    expect(rule4!.destination).toBe('전라/경상');
    expect(rule4!.destinationChute).toBe(10);

    // 규칙은 우선순위 순으로 정렬 가능
    const priorities = activePlan!.rules.map((r) => r.priority);
    expect(priorities).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  // -------------------------------------------------------
  // 4. 활성 계획 조회 (존재하지 않는 계획 활성화 시도)
  // -------------------------------------------------------
  it('존재하지 않는 계획 활성화 시 false를 반환하고 활성 계획이 유지되어야 한다', () => {
    const beforeActive = service.getActivePlan();
    expect(beforeActive!.id).toBe('PLAN-001');

    // 존재하지 않는 계획 활성화 시도
    const result = service.activatePlan('PLAN-NONEXISTENT');
    expect(result).toBe(false);

    // 기존 활성 계획 유지
    const afterActive = service.getActivePlan();
    expect(afterActive!.id).toBe('PLAN-001');
    expect(afterActive!.status).toBe('ACTIVE');
  });

  // -------------------------------------------------------
  // 5. 특수키 조회
  // -------------------------------------------------------
  it('특수키 계획(반송/미구분/특수)이 초기화되어야 한다', () => {
    const specialKeys = service.getSpecialKeys();
    expect(specialKeys).toHaveLength(3);
    expect(specialKeys.map((k) => k.destination)).toEqual(
      expect.arrayContaining(['반송', '미구분', '특수']),
    );

    const returnKey = specialKeys.find((k) => k.destination === '반송');
    expect(returnKey!.chuteNumber).toBe(19);
  });
});
