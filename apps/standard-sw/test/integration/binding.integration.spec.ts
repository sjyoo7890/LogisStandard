import { Test, TestingModule } from '@nestjs/testing';
import { ChuteDisplayService, DisplayPlanMapping } from '../../src/chute-display/chute-display.service';
import { SortingService } from '../../src/sorting/sorting.service';
import { InfoLinkService } from '../../src/info-link/info-link.service';

/**
 * 시나리오 3: 체결(Binding) 통합 테스트
 * - 구분계획과 슈트 표시 체결, 체결정보 조회, SIMS 전송 상태 확인
 *   (SortingService의 구분계획 규칙 → ChuteDisplayService 슈트 매핑 → InfoLinkService 동기화)
 */
describe('체결(Binding) 통합 테스트 (시나리오 3)', () => {
  let sortingService: SortingService;
  let chuteDisplayService: ChuteDisplayService;
  let infoLinkService: InfoLinkService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SortingService, ChuteDisplayService, InfoLinkService],
    }).compile();

    sortingService = module.get<SortingService>(SortingService);
    chuteDisplayService = module.get<ChuteDisplayService>(ChuteDisplayService);
    infoLinkService = module.get<InfoLinkService>(InfoLinkService);

    sortingService.onModuleInit();
    chuteDisplayService.onModuleInit();
    infoLinkService.onModuleInit();
  });

  afterEach(() => {
    sortingService.onModuleDestroy();
    chuteDisplayService.onModuleDestroy();
    infoLinkService.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 체결정보 생성 (구분계획 규칙 → 슈트 매핑 적용)
  // -------------------------------------------------------
  it('활성 구분계획의 규칙을 슈트 표시에 체결(매핑)할 수 있어야 한다', () => {
    // 활성 계획의 규칙에서 매핑 정보 추출
    const activePlan = sortingService.getActivePlan();
    expect(activePlan).toBeDefined();

    const mappings: DisplayPlanMapping[] = activePlan!.rules.map((rule) => ({
      chuteNumber: rule.destinationChute,
      destination: rule.destination,
    }));
    expect(mappings).toHaveLength(10);

    // 슈트 표시에 체결 적용
    const result = chuteDisplayService.applyPlan(mappings);
    expect(result.applied).toBe(10);
    expect(result.total).toBe(10);

    // 체결된 슈트의 목적지가 규칙과 일치하는지 확인
    for (const mapping of mappings) {
      const display = chuteDisplayService.getDisplay(mapping.chuteNumber);
      expect(display).toBeDefined();
      expect(display!.destination).toBe(mapping.destination);
      // 체결 후 카운트가 리셋됨
      expect(display!.currentCount).toBe(0);
      expect(display!.status).toBe('EMPTY');
    }
  });

  // -------------------------------------------------------
  // 2. 체결정보 조회
  // -------------------------------------------------------
  it('체결 적용 후 전체 슈트 표시 정보를 조회할 수 있어야 한다', () => {
    // 체결 적용
    const activePlan = sortingService.getActivePlan()!;
    const mappings: DisplayPlanMapping[] = activePlan.rules.map((rule) => ({
      chuteNumber: rule.destinationChute,
      destination: rule.destination,
    }));
    chuteDisplayService.applyPlan(mappings);

    // 전체 슈트 조회 (20개)
    const allDisplays = chuteDisplayService.getAllDisplays();
    expect(allDisplays).toHaveLength(20);

    // 체결된 슈트(1~10)는 매핑된 목적지를 가짐
    const boundChutes = allDisplays.filter((d) => d.chuteNumber <= 10);
    expect(boundChutes).toHaveLength(10);
    expect(boundChutes[0].destination).toBe('서울강북');
    expect(boundChutes[1].destination).toBe('서울강남');

    // 체결되지 않은 슈트(11~20)는 기존 목적지 유지
    const unboundChute = chuteDisplayService.getDisplay(11);
    expect(unboundChute).toBeDefined();
    expect(unboundChute!.destination).toBeDefined();

    // 요약 확인
    const summary = chuteDisplayService.getSummary();
    expect(summary.totalChutes).toBe(20);
    // 체결된 10개는 EMPTY 상태
    expect(summary.empty).toBeGreaterThanOrEqual(10);
  });

  // -------------------------------------------------------
  // 3. SIMS 전송 상태 확인 (동기화 후 데이터 유효성)
  // -------------------------------------------------------
  it('SIMS 동기화 후 체결 데이터와 정보연계 데이터가 일관되어야 한다', () => {
    // SIMS 동기화 수행
    const syncJob = infoLinkService.sync('SIMS');
    expect(syncJob.status).toBe('SUCCESS');
    expect(syncJob.system).toBe('SIMS');
    expect(syncJob.recordsSynced).toBe(150);

    // 동기화된 정보연계 데이터 조회
    const allData = infoLinkService.getAllData();
    expect(allData).toHaveLength(20);

    // 우편번호로 목적지 조회 기능 확인
    const lookup = infoLinkService.lookupDestination('01000');
    expect(lookup.found).toBe(true);
    expect(lookup.destination).toBeDefined();
    expect(lookup.chuteNumber).toBeDefined();

    // 체결 + 동기화 상태 종합 확인
    const infoStatus = infoLinkService.getStatus();
    expect(infoStatus.totalRecords).toBe(20);
    expect(infoStatus.syncJobsCompleted).toBe(1);
    expect(infoStatus.lastSync).toBeDefined();
  });

  // -------------------------------------------------------
  // 4. 구분계획 전환 후 슈트 재체결
  // -------------------------------------------------------
  it('구분계획을 전환하면 새 계획의 규칙으로 슈트를 재체결할 수 있어야 한다', () => {
    // PLAN-002 활성화
    const activated = sortingService.activatePlan('PLAN-002');
    expect(activated).toBe(true);

    const newActivePlan = sortingService.getActivePlan();
    expect(newActivePlan!.id).toBe('PLAN-002');

    // 새 활성 계획의 규칙으로 재체결
    const mappings: DisplayPlanMapping[] = newActivePlan!.rules.map((rule) => ({
      chuteNumber: rule.destinationChute,
      destination: rule.destination,
    }));
    const result = chuteDisplayService.applyPlan(mappings);
    expect(result.applied).toBe(10);

    // 재체결된 슈트의 목적지 확인 (PLAN-002 규칙 기준)
    const display1 = chuteDisplayService.getDisplay(1);
    expect(display1!.destination).toBe(newActivePlan!.rules[0].destination);
    expect(display1!.currentCount).toBe(0);
  });
});
