import { Test, TestingModule } from '@nestjs/testing';
import { SituationControlService } from '../../src/situation-control/situation-control.service';

/**
 * 현황관제(SituationControl) 통합 테스트
 * - 전체 현황 조회, 슈트/배달점 정보, 알람/구분기 상태
 */
describe('현황관제(SituationControl) 통합 테스트', () => {
  let service: SituationControlService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SituationControlService],
    }).compile();

    service = module.get<SituationControlService>(SituationControlService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 전체 현황 조회
  // -------------------------------------------------------
  it('전체 현황 데이터가 올바른 구조와 값을 가져야 한다', () => {
    const overview = service.getOverview();
    expect(overview).toBeDefined();

    // 처리 실적
    expect(overview.totalProcessed).toBe(4850);
    expect(overview.successRate).toBe(92.3);
    expect(overview.rejectRate).toBe(5.1);

    // 구분기 현황
    expect(overview.activeSorters).toBe(2);
    expect(overview.totalSorters).toBe(2);

    // 알람
    expect(overview.activeAlarms).toBe(2);

    // 운영 시간 (초기화 직후이므로 0분 이상)
    expect(overview.uptimeMinutes).toBeGreaterThanOrEqual(0);
    expect(overview.timestamp).toBeDefined();

    // getStatus 종합 확인
    const status = service.getStatus();
    expect(status.totalChutes).toBe(20);
    expect(status.deliveryPoints).toBe(5);
    expect(status.activeAlarms).toBe(2);
    expect(status.sorters).toBe(2);
  });

  // -------------------------------------------------------
  // 2. 슈트 및 배달점 정보
  // -------------------------------------------------------
  it('슈트 20개와 배달점 5개의 정보가 올바르게 초기화되어야 한다', () => {
    // 슈트 정보: 20개
    const chuteInfos = service.getChuteInfos();
    expect(chuteInfos).toHaveLength(20);

    // 모든 슈트 번호가 1~20 범위
    const chuteNumbers = chuteInfos.map((c) => c.chuteNumber);
    expect(chuteNumbers).toEqual(expect.arrayContaining(
      Array.from({ length: 20 }, (_, i) => i + 1),
    ));

    // 각 슈트에 목적지 할당
    expect(chuteInfos.every((c) => c.destination.length > 0)).toBe(true);
    expect(chuteInfos.every((c) => c.sortedCount >= 0)).toBe(true);

    // 주요 목적지 확인
    expect(chuteInfos[0].destination).toBe('서울강북');
    expect(chuteInfos[19].destination).toBe('미구분');

    // 배달점 정보: 5개
    const deliveryPoints = service.getDeliveryPoints();
    expect(deliveryPoints).toHaveLength(5);

    expect(deliveryPoints[0].name).toBe('서울중앙우체국');
    expect(deliveryPoints[0].region).toBe('서울');
    expect(deliveryPoints[0].chuteNumbers).toEqual([1, 2, 3, 4]);

    expect(deliveryPoints[3].name).toBe('부산중앙우체국');
    expect(deliveryPoints[3].region).toBe('부산');

    // 배달점 데이터 구조 검증
    for (const dp of deliveryPoints) {
      expect(dp.id).toMatch(/^DP-\d{3}$/);
      expect(dp.totalSorted).toBeGreaterThan(0);
      expect(dp.lastUpdate).toBeDefined();
    }
  });

  // -------------------------------------------------------
  // 3. 알람 및 구분기 상태
  // -------------------------------------------------------
  it('초기 알람 2건과 구분기 상태 2개가 올바르게 생성되어야 한다', () => {
    // 알람: 2건 (WARNING, INFO)
    const alarms = service.getAlarms();
    expect(alarms).toHaveLength(2);

    const warning = alarms.find((a) => a.level === 'WARNING');
    expect(warning).toBeDefined();
    expect(warning!.message).toContain('슈트 15');
    expect(warning!.source).toBe('CHT-15');

    const info = alarms.find((a) => a.level === 'INFO');
    expect(info).toBeDefined();
    expect(info!.message).toContain('컨베이어');
    expect(info!.source).toBe('CNV-03');

    // 구분기 상태: 2개 (모두 RUNNING)
    const sorterStatuses = service.getSorterStatuses();
    expect(sorterStatuses).toHaveLength(2);

    expect(sorterStatuses[0].sorterId).toBe('SORTER-01');
    expect(sorterStatuses[0].name).toBe('1호기');
    expect(sorterStatuses[0].status).toBe('RUNNING');
    expect(sorterStatuses[0].speed).toBe(12000);
    expect(sorterStatuses[0].processedToday).toBe(2500);

    expect(sorterStatuses[1].sorterId).toBe('SORTER-02');
    expect(sorterStatuses[1].status).toBe('RUNNING');
    expect(sorterStatuses[1].speed).toBe(11500);
    expect(sorterStatuses[1].errorCount).toBe(0);
  });
});
