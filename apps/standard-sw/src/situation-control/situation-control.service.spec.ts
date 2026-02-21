import { Test, TestingModule } from '@nestjs/testing';
import { SituationControlService } from './situation-control.service';

describe('SituationControlService', () => {
  let service: SituationControlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SituationControlService],
    }).compile();

    service = module.get<SituationControlService>(SituationControlService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return overview with correct fields', () => {
    const overview = service.getOverview();
    expect(overview).toHaveProperty('totalProcessed');
    expect(overview).toHaveProperty('successRate');
    expect(overview).toHaveProperty('rejectRate');
    expect(overview).toHaveProperty('uptimeMinutes');
    expect(overview.activeSorters).toBe(2);
  });

  it('should return 20 chute infos', () => {
    const chutes = service.getChuteInfos();
    expect(chutes.length).toBe(20);
    expect(chutes[0]).toHaveProperty('chuteNumber');
    expect(chutes[0]).toHaveProperty('destination');
    expect(chutes[0]).toHaveProperty('sortedCount');
  });

  it('should return 5 delivery points', () => {
    const points = service.getDeliveryPoints();
    expect(points.length).toBe(5);
    expect(points[0]).toHaveProperty('name');
    expect(points[0]).toHaveProperty('region');
  });

  it('should return alarms', () => {
    const alarms = service.getAlarms();
    expect(alarms.length).toBeGreaterThanOrEqual(2);
    expect(alarms[0]).toHaveProperty('level');
    expect(alarms[0]).toHaveProperty('message');
  });

  it('should return 2 sorter statuses', () => {
    const statuses = service.getSorterStatuses();
    expect(statuses.length).toBe(2);
    expect(statuses[0].status).toBe('RUNNING');
  });

  it('should track uptime in overview', () => {
    const overview = service.getOverview();
    expect(overview.uptimeMinutes).toBeGreaterThanOrEqual(0);
  });

  it('should return status summary', () => {
    const status = service.getStatus();
    expect(status).toHaveProperty('overview');
    expect(status.totalChutes).toBe(20);
    expect(status.deliveryPoints).toBe(5);
    expect(status.sorters).toBe(2);
  });
});
