import { Test, TestingModule } from '@nestjs/testing';
import { SortingService } from './sorting.service';

describe('SortingService', () => {
  let service: SortingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SortingService],
    }).compile();

    service = module.get<SortingService>(SortingService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 2 plans', () => {
    const plans = service.getAllPlans();
    expect(plans.length).toBe(2);
  });

  it('should have one active plan', () => {
    const active = service.getActivePlan();
    expect(active).toBeDefined();
    expect(active!.status).toBe('ACTIVE');
  });

  it('should have 10 rules per plan', () => {
    const rules = service.getRulesForPlan('PLAN-001');
    expect(rules.length).toBe(10);
  });

  it('should process barcode with 42-prefix successfully', () => {
    const event = service.processBarcode('4201234567890');
    expect(event.barcode).toBe('4201234567890');
    expect(event.zipCode).toBe('01234');
    expect(event.result).toBe('SUCCESS');
    expect(event.assignedChute).toBeLessThanOrEqual(20);
  });

  it('should reject barcode with unknown zip code', () => {
    const event = service.processBarcode('4299999000000');
    expect(event.result).toBe('REJECT');
    expect(event.assignedChute).toBe(20);
  });

  it('should process numeric barcode as zip code', () => {
    const event = service.processBarcode('0100000001');
    expect(event.zipCode).toBe('01000');
    expect(event.result).toBe('SUCCESS');
  });

  it('should create a new plan in DRAFT status', () => {
    const plan = service.createPlan('Test Plan');
    expect(plan.status).toBe('DRAFT');
    expect(plan.name).toBe('Test Plan');
  });

  it('should activate a plan and archive previous', () => {
    const success = service.activatePlan('PLAN-002');
    expect(success).toBe(true);
    const plan002 = service.getPlan('PLAN-002');
    expect(plan002!.status).toBe('ACTIVE');
    const plan001 = service.getPlan('PLAN-001');
    expect(plan001!.status).toBe('ARCHIVED');
  });

  it('should track sort history', () => {
    service.processBarcode('4201234000000');
    service.processBarcode('4202345000000');
    const history = service.getSortHistory();
    expect(history.length).toBe(2);
  });

  it('should generate comm log on sort', () => {
    service.processBarcode('4201234000000');
    const log = service.getCommLog();
    expect(log.length).toBe(1);
    expect(log[0].direction).toBe('SEND');
  });

  it('should return correct stats', () => {
    service.processBarcode('4201234000000');
    service.processBarcode('4299999000000');
    const stats = service.getStats();
    expect(stats.totalProcessed).toBe(2);
    expect(stats.successCount).toBe(1);
    expect(stats.rejectCount).toBe(1);
  });
});
