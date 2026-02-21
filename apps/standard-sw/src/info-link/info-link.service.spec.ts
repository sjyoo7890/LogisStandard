import { Test, TestingModule } from '@nestjs/testing';
import { InfoLinkService } from './info-link.service';

describe('InfoLinkService', () => {
  let service: InfoLinkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoLinkService],
    }).compile();

    service = module.get<InfoLinkService>(InfoLinkService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 20 sorting data records', () => {
    const data = service.getAllData();
    expect(data.length).toBe(20);
  });

  it('should sync SIMS successfully', () => {
    const job = service.sync('SIMS');
    expect(job.system).toBe('SIMS');
    expect(job.status).toBe('SUCCESS');
    expect(job.recordsSynced).toBe(150);
  });

  it('should sync KPLAS successfully', () => {
    const job = service.sync('KPLAS');
    expect(job.system).toBe('KPLAS');
    expect(job.status).toBe('SUCCESS');
    expect(job.recordsSynced).toBe(80);
  });

  it('should lookup destination by zip code', () => {
    const result = service.lookupDestination('01000');
    expect(result.found).toBe(true);
    expect(result.destination).toBeDefined();
    expect(result.chuteNumber).toBeDefined();
  });

  it('should return not found for unknown zip code', () => {
    const result = service.lookupDestination('99999');
    expect(result.found).toBe(false);
  });

  it('should return scheduler state', () => {
    const scheduler = service.getScheduler();
    expect(scheduler.simsEnabled).toBe(true);
    expect(scheduler.kplasEnabled).toBe(true);
    expect(scheduler.simsInterval).toBe(600000);
  });

  it('should return status summary', () => {
    const status = service.getStatus();
    expect(status.totalRecords).toBe(20);
    expect(status).toHaveProperty('scheduler');
    expect(status).toHaveProperty('syncJobsCompleted');
  });
});
