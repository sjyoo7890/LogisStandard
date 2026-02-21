import { Test, TestingModule } from '@nestjs/testing';
import { FallbackService } from './fallback.service';
import { ConnectionService } from '../connection/connection.service';

describe('FallbackService', () => {
  let service: FallbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackService,
        {
          provide: ConnectionService,
          useValue: {
            isSimsConnected: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<FallbackService>(FallbackService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start with INACTIVE status', () => {
    const status = service.getStatus();
    expect(status.status).toBe('INACTIVE');
    expect(status.pendingRecords).toBe(0);
    expect(status.csvFilesGenerated).toBe(0);
  });

  it('should not add records when not activated', () => {
    service.addPendingRecord('SORTING_RESULT', { barcode: '123' });
    const status = service.getStatus();
    expect(status.pendingRecords).toBe(0);
  });

  it('should return empty pending records when inactive', () => {
    const records = service.getPendingRecords();
    expect(records).toEqual([]);
  });

  it('should return empty events initially', () => {
    const events = service.getEvents();
    expect(events).toEqual([]);
  });

  it('should return empty CSV files initially', () => {
    const files = service.getCSVFiles();
    expect(files).toEqual([]);
  });

  it('should return null when generating CSV with no pending records', () => {
    const result = service.triggerCSVGeneration();
    expect(result).toBeNull();
  });
});
