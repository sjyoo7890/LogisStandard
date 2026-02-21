import { Test, TestingModule } from '@nestjs/testing';
import { TestRunnerService } from '../../src/test-runner/test-runner.service';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 테스트 실행 서비스 통합 테스트
 * - 테스트 실행 (SORTING, COMMUNICATION, PROTOCOL, INTEGRATION)
 * - 테스트 리포트 생성
 * - 리포트 조회
 */
describe('TestRunnerService 통합 테스트', () => {
  let service: TestRunnerService;
  let plcService: PLCConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestRunnerService, PLCConnectionService, EquipmentMonitorService],
    }).compile();

    service = module.get<TestRunnerService>(TestRunnerService);
    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    plcService.onModuleInit();
  });

  afterEach(() => {
    plcService.onModuleDestroy();
  });

  // 테스트 1: 4가지 유형의 테스트 실행
  it('SORTING, COMMUNICATION, PROTOCOL, INTEGRATION 테스트가 모두 실행되어야 한다', async () => {
    // SORTING 테스트
    const sortingReport = await service.runTest('SORTING', '구분 테스트');
    expect(sortingReport.type).toBe('SORTING');
    expect(sortingReport.name).toBe('구분 테스트');
    expect(sortingReport.totalTests).toBe(5);
    expect(sortingReport.status).toMatch(/COMPLETED|FAILED/);
    expect(sortingReport.reportId).toBeDefined();
    expect(sortingReport.startedAt).toBeDefined();
    expect(sortingReport.completedAt).toBeDefined();

    // COMMUNICATION 테스트
    const commReport = await service.runTest('COMMUNICATION');
    expect(commReport.type).toBe('COMMUNICATION');
    expect(commReport.totalTests).toBe(5);

    // PROTOCOL 테스트
    const protoReport = await service.runTest('PROTOCOL');
    expect(protoReport.type).toBe('PROTOCOL');
    expect(protoReport.totalTests).toBe(6);

    // INTEGRATION 테스트
    const integReport = await service.runTest('INTEGRATION');
    expect(integReport.type).toBe('INTEGRATION');
    expect(integReport.totalTests).toBe(4);

    // 각 테스트 케이스의 구조 확인
    for (const tc of sortingReport.tests) {
      expect(tc.id).toBeDefined();
      expect(tc.name).toBeDefined();
      expect(tc.type).toBe('SORTING');
      expect(tc.description).toBeDefined();
      expect(tc.status).toMatch(/PASS|FAIL/);
      expect(tc.expected).toBeDefined();
      expect(tc.actual).toBeDefined();
      expect(tc.duration).toBeGreaterThanOrEqual(0);
    }
  });

  // 테스트 2: 테스트 리포트 생성 및 요약 정보
  it('테스트 리포트가 올바른 요약 정보를 포함해야 한다', async () => {
    const report = await service.runTest('SORTING', '구분 기능 테스트');

    // 리포트 기본 정보
    expect(report.reportId).toMatch(/^TEST_/);
    expect(report.name).toBe('구분 기능 테스트');
    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);

    // passed + failed = totalTests
    expect(report.passed + report.failed + report.skipped).toBe(report.totalTests);

    // 요약 문자열 형식 확인
    expect(report.summary).toContain('passed');

    // 완료 시간이 시작 시간 이후
    expect(new Date(report.completedAt!).getTime()).toBeGreaterThanOrEqual(
      new Date(report.startedAt).getTime(),
    );
  });

  // 테스트 3: 리포트 저장 및 조회
  it('실행된 테스트 리포트를 ID 및 전체 목록으로 조회할 수 있어야 한다', async () => {
    // 3개 테스트 실행
    const report1 = await service.runTest('SORTING');
    const report2 = await service.runTest('COMMUNICATION');
    const report3 = await service.runTest('PROTOCOL');

    // ID로 개별 조회
    const retrieved = service.getReport(report1.reportId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.reportId).toBe(report1.reportId);
    expect(retrieved!.type).toBe('SORTING');

    // 존재하지 않는 ID 조회
    expect(service.getReport('NONEXISTENT')).toBeUndefined();

    // 전체 목록 조회 (최신순)
    const allReports = service.getAllReports();
    expect(allReports.length).toBe(3);

    // 최신순 정렬 확인
    for (let i = 0; i < allReports.length - 1; i++) {
      expect(allReports[i].startedAt >= allReports[i + 1].startedAt).toBe(true);
    }

    // 각 리포트 타입 확인
    const types = allReports.map((r) => r.type);
    expect(types).toContain('SORTING');
    expect(types).toContain('COMMUNICATION');
    expect(types).toContain('PROTOCOL');
  });
});
