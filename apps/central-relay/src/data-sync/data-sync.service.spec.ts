import { Test, TestingModule } from '@nestjs/testing';
import { DataSyncService } from './data-sync.service';
import { ConnectionService } from '../connection/connection.service';

describe('DataSyncService', () => {
  let service: DataSyncService;
  let connectionService: ConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSyncService,
        {
          provide: ConnectionService,
          useValue: {
            isSimsConnected: jest.fn().mockReturnValue(true),
            getAllConnections: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<DataSyncService>(DataSyncService);
    connectionService = module.get<ConnectionService>(ConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute sync job for inbound', async () => {
    const job = await service.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
    expect(job).toBeDefined();
    expect(job.direction).toBe('SIMS_TO_CENTER');
    expect(job.syncType).toBe('RECEPTION_INFO');
    expect(job.status).toBe('COMPLETED');
  });

  it('should execute sync job for outbound', async () => {
    const job = await service.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');
    expect(job).toBeDefined();
    expect(job.direction).toBe('CENTER_TO_SIMS');
    expect(job.syncType).toBe('SORTING_RESULT');
    expect(job.status).toBe('COMPLETED');
  });

  it('should trigger manual sync', async () => {
    const job = await service.triggerManualSync(
      'SIMS_TO_CENTER',
      'ADDRESS_ROUTE_DB',
      'SEOUL',
    );
    expect(job).toBeDefined();
    expect(job.targetId).toBe('SEOUL');
  });

  it('should track sync history', async () => {
    await service.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
    await service.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');

    const history = service.getSyncHistory();
    expect(history.length).toBe(2);
  });

  it('should filter sync history by direction', async () => {
    await service.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');
    await service.executeSyncJob('CENTER_TO_SIMS', 'SORTING_RESULT');

    const inbound = service.getSyncHistory({ direction: 'SIMS_TO_CENTER' });
    expect(inbound.length).toBe(1);
    expect(inbound[0].direction).toBe('SIMS_TO_CENTER');
  });

  it('should return sync status summary', async () => {
    await service.executeSyncJob('SIMS_TO_CENTER', 'RECEPTION_INFO');

    const status = service.getSyncStatus();
    expect(status).toHaveProperty('currentJobs');
    expect(status).toHaveProperty('totalCompleted');
    expect(status).toHaveProperty('totalFailed');
    expect(status).toHaveProperty('lastSyncTimes');
    expect(status.totalCompleted).toBe(1);
  });

  it('should return empty current jobs when none are running', () => {
    const jobs = service.getCurrentJobs();
    expect(jobs).toEqual([]);
  });
});
