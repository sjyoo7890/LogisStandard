import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceService, PLCConnectionService, EquipmentMonitorService],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should run relay bypass inspection', async () => {
    const report = await service.runRelayBypassInspection();
    expect(report.type).toBe('RELAY_BYPASS');
    expect(report.items.length).toBe(5);
    expect(report.status).toMatch(/COMPLETED|FAILED/);
  });

  it('should run H/W check', async () => {
    const report = await service.runHWCheck();
    expect(report.type).toBe('HW_CHECK');
    expect(report.items.length).toBeGreaterThanOrEqual(8);
  });

  it('should run full inspection', async () => {
    const report = await service.runFullInspection();
    expect(report.type).toBe('FULL_INSPECTION');
    expect(report.items.length).toBe(12);
  });

  it('should retrieve report by ID', async () => {
    const report = await service.runRelayBypassInspection();
    const retrieved = service.getReport(report.reportId);
    expect(retrieved?.reportId).toBe(report.reportId);
  });

  it('should list all reports', async () => {
    await service.runRelayBypassInspection();
    await service.runHWCheck();
    const reports = service.getAllReports();
    expect(reports.length).toBe(2);
  });

  it('should have summary in report', async () => {
    const report = await service.runFullInspection();
    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);
  });
});
