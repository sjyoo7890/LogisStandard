import { Test, TestingModule } from '@nestjs/testing';
import { ChuteDisplayService } from './chute-display.service';

describe('ChuteDisplayService', () => {
  let service: ChuteDisplayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChuteDisplayService],
    }).compile();

    service = module.get<ChuteDisplayService>(ChuteDisplayService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 20 chute displays', () => {
    const displays = service.getAllDisplays();
    expect(displays.length).toBe(20);
  });

  it('should get individual chute display', () => {
    const display = service.getDisplay(1);
    expect(display).toBeDefined();
    expect(display!.chuteNumber).toBe(1);
    expect(display!.destination).toBe('서울강북');
  });

  it('should apply plan mappings', () => {
    const result = service.applyPlan([
      { chuteNumber: 1, destination: '테스트A' },
      { chuteNumber: 2, destination: '테스트B' },
    ]);
    expect(result.applied).toBe(2);
    const d1 = service.getDisplay(1);
    expect(d1!.destination).toBe('테스트A');
    expect(d1!.currentCount).toBe(0);
    expect(d1!.status).toBe('EMPTY');
  });

  it('should increment chute count', () => {
    // Reset first to have known state
    service.resetChute(1);
    const result = service.incrementCount(1);
    expect(result).toBeDefined();
    expect(result!.currentCount).toBe(1);
  });

  it('should transition to NEAR_FULL at 80%', () => {
    service.resetChute(1);
    // capacity is 200, 80% = 160
    for (let i = 0; i < 160; i++) {
      service.incrementCount(1);
    }
    const display = service.getDisplay(1);
    expect(display!.status).toBe('NEAR_FULL');
  });

  it('should reset chute count', () => {
    const success = service.resetChute(5);
    expect(success).toBe(true);
    const display = service.getDisplay(5);
    expect(display!.currentCount).toBe(0);
    expect(display!.status).toBe('EMPTY');
  });

  it('should return summary with correct totals', () => {
    const summary = service.getSummary();
    expect(summary.totalChutes).toBe(20);
    expect(summary).toHaveProperty('normal');
    expect(summary).toHaveProperty('nearFull');
    expect(summary).toHaveProperty('full');
    expect(summary).toHaveProperty('totalItems');
  });
});
