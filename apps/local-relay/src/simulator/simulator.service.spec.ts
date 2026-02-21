import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorService } from './simulator.service';

describe('SimulatorService', () => {
  let service: SimulatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SimulatorService],
    }).compile();

    service = module.get<SimulatorService>(SimulatorService);
  });

  afterEach(() => {
    service.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start and stop simulation', () => {
    expect(service.start()).toBe(true);
    expect(service.isRunning()).toBe(true);
    expect(service.stop()).toBe(true);
    expect(service.isRunning()).toBe(false);
  });

  it('should not start twice', () => {
    service.start();
    expect(service.start()).toBe(false);
  });

  it('should not stop when not running', () => {
    expect(service.stop()).toBe(false);
  });

  it('should simulate one item', () => {
    const item = service.simulateOne('4201234567890');
    expect(item.barcode).toBe('4201234567890');
    expect(item.result).toBeDefined();
    expect(item.pid).toBeGreaterThan(100000);
  });

  it('should handle NO_READ for empty barcode', () => {
    const item = service.simulateOne('');
    expect(item.result).toBe('NO_READ');
    expect(item.assignedChute).toBe(0);
  });

  it('should have sorting rules', () => {
    const rules = service.getRules();
    expect(rules.length).toBe(4);
  });

  it('should change sorting rule', () => {
    expect(service.setRule('MODULO')).toBe(true);
    expect(service.getActiveRule().rule).toBe('MODULO');
  });

  it('should return false for invalid rule', () => {
    expect(service.setRule('INVALID' as any)).toBe(false);
  });

  it('should verify chute assignment', () => {
    const result = service.verify(15, 15, '4201234567890');
    expect(result.match).toBe(true);

    const mismatch = service.verify(15, 20, '4201234567890');
    expect(mismatch.match).toBe(false);
  });

  it('should return stats', () => {
    const stats = service.getStats();
    expect(stats).toHaveProperty('running');
    expect(stats).toHaveProperty('totalItems');
    expect(stats).toHaveProperty('successCount');
    expect(stats).toHaveProperty('rejectCount');
    expect(stats).toHaveProperty('noReadCount');
  });

  it('should reset simulator', () => {
    service.simulateOne('42012345');
    service.reset();
    expect(service.getItems().length).toBe(0);
    expect(service.isRunning()).toBe(false);
  });
});
