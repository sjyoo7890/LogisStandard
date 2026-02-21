import { Test, TestingModule } from '@nestjs/testing';
import { TestRunnerService } from './test-runner.service';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

describe('TestRunnerService', () => {
  let service: TestRunnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestRunnerService, PLCConnectionService, EquipmentMonitorService],
    }).compile();

    service = module.get<TestRunnerService>(TestRunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should run SORTING test', async () => {
    const report = await service.runTest('SORTING');
    expect(report.type).toBe('SORTING');
    expect(report.totalTests).toBe(5);
    expect(report.status).toMatch(/COMPLETED|FAILED/);
  });

  it('should run COMMUNICATION test', async () => {
    const report = await service.runTest('COMMUNICATION', 'Comm Test');
    expect(report.name).toBe('Comm Test');
    expect(report.totalTests).toBe(5);
  });

  it('should run PROTOCOL test', async () => {
    const report = await service.runTest('PROTOCOL');
    expect(report.totalTests).toBe(6);
  });

  it('should run INTEGRATION test', async () => {
    const report = await service.runTest('INTEGRATION');
    expect(report.totalTests).toBe(4);
  });

  it('should retrieve report by ID', async () => {
    const report = await service.runTest('SORTING');
    const retrieved = service.getReport(report.reportId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.reportId).toBe(report.reportId);
  });

  it('should list all reports', async () => {
    await service.runTest('SORTING');
    await service.runTest('PROTOCOL');
    const reports = service.getAllReports();
    expect(reports.length).toBe(2);
  });

  it('should generate test report summary', async () => {
    const report = await service.runTest('SORTING');
    expect(report.summary).toBeDefined();
    expect(report.summary.length).toBeGreaterThan(0);
  });
});
