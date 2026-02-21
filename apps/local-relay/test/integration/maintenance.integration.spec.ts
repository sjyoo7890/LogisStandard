import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from '../../src/maintenance/maintenance.service';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 유지보수 서비스 통합 테스트
 * - 릴레이 바이패스 점검
 * - H/W 체크
 * - 전체 점검
 * - 점검 리포트 조회
 */
describe('MaintenanceService 통합 테스트', () => {
  let service: MaintenanceService;
  let plcService: PLCConnectionService;
  let eqService: EquipmentMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceService, PLCConnectionService, EquipmentMonitorService],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);

    plcService.onModuleInit();
  });

  afterEach(() => {
    plcService.onModuleDestroy();
  });

  // 테스트 1: 릴레이 바이패스 점검
  it('릴레이 바이패스 점검이 5개 항목을 검사하고 리포트를 생성해야 한다', async () => {
    const report = await service.runRelayBypassInspection();

    // 리포트 기본 구조 확인
    expect(report.reportId).toBeDefined();
    expect(report.type).toBe('RELAY_BYPASS');
    expect(report.items.length).toBe(5);
    expect(report.status).toMatch(/COMPLETED|FAILED/);
    expect(report.startedAt).toBeDefined();
    expect(report.completedAt).toBeDefined();
    expect(report.summary).toBeDefined();

    // 점검 항목 카테고리 확인
    const categories = report.items.map((item) => item.category);
    expect(categories).toContain('연결');
    expect(categories).toContain('통신');
    expect(categories).toContain('동작');

    // 각 점검 항목 구조 확인
    for (const item of report.items) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.status).toMatch(/PASS|FAIL/);
      expect(item.detail).toBeDefined();
      expect(item.checkedAt).toBeDefined();
    }

    // passed + failed = 전체 항목 수
    expect(report.passed + report.failed).toBe(report.items.length);
  });

  // 테스트 2: H/W 장비 점검
  it('H/W 체크가 장비 기반 점검 항목을 포함하여 검사해야 한다', async () => {
    const report = await service.runHWCheck();

    // H/W 체크 리포트
    expect(report.type).toBe('HW_CHECK');
    // 기본 8개 + 컨베이어 장비(2개) = 최소 10개
    expect(report.items.length).toBeGreaterThanOrEqual(10);
    expect(report.status).toMatch(/COMPLETED|FAILED/);

    // 점검 카테고리 확인
    const categories = [...new Set(report.items.map((item) => item.category))];
    expect(categories).toContain('기구부');
    expect(categories).toContain('센서');
    expect(categories).toContain('통신');
    expect(categories).toContain('안전');
    expect(categories).toContain('컨베이어');

    // 요약 정보 확인
    expect(report.summary).toContain('항목 통과');
  });

  // 테스트 3: 전체 점검
  it('전체 점검이 12개 항목을 포괄적으로 검사해야 한다', async () => {
    const report = await service.runFullInspection();

    expect(report.type).toBe('FULL_INSPECTION');
    expect(report.items.length).toBe(12);
    expect(report.status).toMatch(/COMPLETED|FAILED/);

    // 전체 점검 카테고리: 통신, 장비, 센서, 프로토콜
    const categories = [...new Set(report.items.map((item) => item.category))];
    expect(categories).toContain('통신');
    expect(categories).toContain('장비');
    expect(categories).toContain('센서');
    expect(categories).toContain('프로토콜');

    // 프로토콜 관련 항목 확인
    const protocolItems = report.items.filter((item) => item.category === '프로토콜');
    expect(protocolItems.length).toBe(3);

    // 통신 관련 항목 확인
    const commItems = report.items.filter((item) => item.category === '통신');
    expect(commItems.length).toBe(3);
  });

  // 테스트 4: 점검 리포트 저장 및 조회
  it('모든 점검 리포트가 저장되고 조회할 수 있어야 한다', async () => {
    // 3종류 점검 수행
    const bypassReport = await service.runRelayBypassInspection();
    const hwReport = await service.runHWCheck();
    const fullReport = await service.runFullInspection();

    // 개별 리포트 조회
    const retrieved = service.getReport(bypassReport.reportId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.reportId).toBe(bypassReport.reportId);
    expect(retrieved!.type).toBe('RELAY_BYPASS');

    // 존재하지 않는 리포트 조회
    expect(service.getReport('NONEXISTENT')).toBeUndefined();

    // 전체 리포트 목록 (최신순)
    const allReports = service.getAllReports();
    expect(allReports.length).toBe(3);

    // 최신순 정렬 확인
    for (let i = 0; i < allReports.length - 1; i++) {
      expect(allReports[i].startedAt >= allReports[i + 1].startedAt).toBe(true);
    }

    // 리포트 타입 확인
    const types = allReports.map((r) => r.type);
    expect(types).toContain('RELAY_BYPASS');
    expect(types).toContain('HW_CHECK');
    expect(types).toContain('FULL_INSPECTION');

    // 동일 유형 추가 점검
    await service.runRelayBypassInspection();
    expect(service.getAllReports().length).toBe(4);
  });
});
