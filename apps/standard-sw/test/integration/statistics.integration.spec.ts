import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from '../../src/statistics/statistics.service';

/**
 * 통계 통합 테스트
 * - 일별 통계, 인덕션/슈트/우편번호별 통계, CSV 내보내기, 날짜 범위 필터
 */
describe('통계(Statistics) 통합 테스트', () => {
  let service: StatisticsService;
  let module: TestingModule;
  let todayStr: string;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    service.onModuleInit();

    todayStr = new Date().toISOString().split('T')[0];
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 일별 통계 조회
  // -------------------------------------------------------
  it('3일치 일별 통계가 초기화되어야 하며 올바른 구조를 가져야 한다', () => {
    const summary = service.getSummary();
    expect(summary).toHaveLength(3);

    // 각 일별 통계의 구조 검증
    for (const daily of summary) {
      expect(daily.date).toBeDefined();
      expect(daily.totalProcessed).toBeGreaterThan(0);
      expect(daily.successCount).toBeGreaterThan(0);
      expect(daily.rejectCount).toBeGreaterThanOrEqual(0);
      expect(daily.recheckCount).toBeGreaterThanOrEqual(0);
      expect(daily.successRate).toBe(92.0);
      // 성공 + 거부 + 재확인 = 전체 처리량 근사치
      expect(daily.successCount + daily.rejectCount + daily.recheckCount)
        .toBeCloseTo(daily.totalProcessed, -1);
    }

    // 오늘 날짜의 통계가 가장 많은 처리량
    const todayStats = summary.find((s) => s.date === todayStr);
    expect(todayStats).toBeDefined();
    expect(todayStats!.totalProcessed).toBe(5000);
  });

  // -------------------------------------------------------
  // 2. 인덕션/슈트/우편번호별 통계 조회
  // -------------------------------------------------------
  it('인덕션별, 슈트별, 우편번호별 통계가 올바르게 초기화되어야 한다', () => {
    // 인덕션별 통계: 3일 x 2개 인덕션 = 6건
    const inductionStats = service.getInductionStats();
    expect(inductionStats).toHaveLength(6);
    expect(inductionStats.every((s) => s.inductionId.startsWith('IND-'))).toBe(true);
    expect(inductionStats.every((s) => s.avgProcessingTime > 0)).toBe(true);

    // 슈트별 통계: 3일 x 20개 슈트 = 60건
    const chuteStats = service.getChuteStats();
    expect(chuteStats).toHaveLength(60);
    expect(chuteStats.every((s) => s.chuteNumber >= 1 && s.chuteNumber <= 20)).toBe(true);

    // 우편번호별 통계: 3일 x 10개 코드 = 30건
    const codeStats = service.getCodeStats();
    expect(codeStats).toHaveLength(30);
    expect(codeStats.every((s) => s.zipCodePrefix.length === 2)).toBe(true);

    // 구분기별 통계: 3일 x 2개 = 6건
    const sorterStats = service.getSorterStats();
    expect(sorterStats).toHaveLength(6);
    expect(sorterStats.every((s) => s.uptime >= 95)).toBe(true);

    // 행선지별 통계: 3일 x 5개 = 15건
    const destStats = service.getDestinationStats();
    expect(destStats).toHaveLength(15);
    expect(destStats.every((s) => s.chuteNumbers.length > 0)).toBe(true);
  });

  // -------------------------------------------------------
  // 3. CSV 내보내기
  // -------------------------------------------------------
  it('CSV 내보내기 시 올바른 헤더와 데이터 행을 포함해야 한다', () => {
    // summary 타입 CSV
    const summaryCSV = service.exportToCSV('summary');
    const summaryLines = summaryCSV.split('\n');
    expect(summaryLines[0]).toBe('date,totalProcessed,successCount,rejectCount,recheckCount,successRate');
    expect(summaryLines.length).toBe(4); // 헤더 + 3일

    // 각 데이터 행 형식 검증
    const dataRow = summaryLines[1].split(',');
    expect(dataRow).toHaveLength(6);
    expect(dataRow[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD

    // induction 타입 CSV
    const inductionCSV = service.exportToCSV('induction');
    const inductionLines = inductionCSV.split('\n');
    expect(inductionLines[0]).toBe('inductionId,date,totalProcessed,successCount,rejectCount,avgProcessingTime');
    expect(inductionLines.length).toBe(7); // 헤더 + 6건

    // chute 타입 CSV
    const chuteCSV = service.exportToCSV('chute');
    const chuteLines = chuteCSV.split('\n');
    expect(chuteLines[0]).toBe('chuteNumber,date,totalItems,destination,fullCount,nearFullCount');
    expect(chuteLines.length).toBe(61); // 헤더 + 60건

    // 알 수 없는 타입은 기본 summary 형식
    const defaultCSV = service.exportToCSV('unknown');
    expect(defaultCSV.split('\n')[0]).toBe('date,totalProcessed,successCount,rejectCount,recheckCount,successRate');
  });

  // -------------------------------------------------------
  // 4. 날짜 범위 필터
  // -------------------------------------------------------
  it('dateFrom/dateTo 파라미터로 통계를 필터링할 수 있어야 한다', () => {
    // 오늘 날짜로만 필터링
    const todaySummary = service.getSummary(undefined, todayStr, todayStr);
    expect(todaySummary).toHaveLength(1);
    expect(todaySummary[0].date).toBe(todayStr);

    // 오늘 날짜 인덕션 통계
    const todayInduction = service.getInductionStats(todayStr, todayStr);
    expect(todayInduction).toHaveLength(2); // 2개 인덕션

    // 오늘 날짜 슈트 통계
    const todayChute = service.getChuteStats(todayStr, todayStr);
    expect(todayChute).toHaveLength(20); // 20개 슈트

    // 미래 날짜로 필터링 → 결과 없음
    const futureSummary = service.getSummary(undefined, '2099-01-01', '2099-12-31');
    expect(futureSummary).toHaveLength(0);
  });

  // -------------------------------------------------------
  // 5. 통계 상태 요약
  // -------------------------------------------------------
  it('getStatus가 모든 통계 카테고리의 레코드 수를 반환해야 한다', () => {
    const status = service.getStatus();
    expect(status.daysOfData).toBe(3);
    expect(status.totalInductionRecords).toBe(6);
    expect(status.totalChuteRecords).toBe(60);
    expect(status.totalCodeRecords).toBe(30);
    expect(status.totalSorterRecords).toBe(6);
    expect(status.totalDestinationRecords).toBe(15);
  });
});
