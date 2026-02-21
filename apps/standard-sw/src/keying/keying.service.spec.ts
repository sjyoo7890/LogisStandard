import { Test, TestingModule } from '@nestjs/testing';
import { KeyingService } from './keying.service';

describe('KeyingService', () => {
  let service: KeyingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeyingService],
    }).compile();

    service = module.get<KeyingService>(KeyingService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 2 stations', () => {
    const stations = service.getAllStations();
    expect(stations.length).toBe(2);
  });

  it('should have 16 buttons per station', () => {
    const station = service.getStation('KST-01');
    expect(station).toBeDefined();
    expect(station!.buttons.length).toBe(16);
  });

  it('should create a keying request', () => {
    const req = service.createRequest('4201234567890', 'KST-01');
    expect(req.barcode).toBe('4201234567890');
    expect(req.stationId).toBe('KST-01');
    expect(req.status).toBe('DISPLAYED');
  });

  it('should complete a keying request', () => {
    const req = service.createRequest('4201234567890', 'KST-01');
    const completed = service.completeRequest(req.id, 1);
    expect(completed).toBeDefined();
    expect(completed!.status).toBe('COMPLETED');
    expect(completed!.destination).toBe('서울강북');
    expect(completed!.chuteNumber).toBe(1);
  });

  it('should track station processed count', () => {
    const req = service.createRequest('4201234567890', 'KST-01');
    service.completeRequest(req.id, 1);
    const station = service.getStation('KST-01');
    expect(station!.processedCount).toBe(1);
  });

  it('should record keying history', () => {
    const req = service.createRequest('4201234567890', 'KST-01');
    service.completeRequest(req.id, 3);
    const history = service.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].barcode).toBe('4201234567890');
  });

  it('should return pending requests', () => {
    service.createRequest('4201111000000', 'KST-01');
    service.createRequest('4202222000000', 'KST-02');
    const pending = service.getPendingRequests('KST-01');
    expect(pending.length).toBe(1);
  });

  it('should return keying stats', () => {
    const stats = service.getStats();
    expect(stats.totalStations).toBe(2);
    expect(stats.onlineStations).toBe(2);
    expect(stats.totalProcessed).toBe(0);
  });

  it('should return undefined for completing non-existent request', () => {
    const result = service.completeRequest('KR-99999', 1);
    expect(result).toBeUndefined();
  });
});
