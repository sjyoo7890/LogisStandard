import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 3 days of summary data', () => {
    const summary = service.getSummary();
    expect(summary.length).toBe(3);
  });

  it('should have induction stats for 2 inductions × 3 days', () => {
    const stats = service.getInductionStats();
    expect(stats.length).toBe(6);
  });

  it('should have chute stats for 20 chutes × 3 days', () => {
    const stats = service.getChuteStats();
    expect(stats.length).toBe(60);
  });

  it('should have code stats for 10 prefixes × 3 days', () => {
    const stats = service.getCodeStats();
    expect(stats.length).toBe(30);
  });

  it('should have sorter stats for 2 sorters × 3 days', () => {
    const stats = service.getSorterStats();
    expect(stats.length).toBe(6);
  });

  it('should have destination stats for 5 destinations × 3 days', () => {
    const stats = service.getDestinationStats();
    expect(stats.length).toBe(15);
  });

  it('should filter by date range', () => {
    const today = new Date().toISOString().split('T')[0];
    const summary = service.getSummary(undefined, today, today);
    expect(summary.length).toBe(1);
  });

  it('should export summary CSV', () => {
    const csv = service.exportToCSV('summary');
    expect(csv).toContain('date,totalProcessed');
    const lines = csv.split('\n');
    expect(lines.length).toBe(4); // header + 3 data rows
  });

  it('should return status overview', () => {
    const status = service.getStatus();
    expect(status.daysOfData).toBe(3);
    expect(status.totalChuteRecords).toBe(60);
  });
});
