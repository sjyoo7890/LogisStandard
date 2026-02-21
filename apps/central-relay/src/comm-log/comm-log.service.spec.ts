import { Test, TestingModule } from '@nestjs/testing';
import { CommLogService } from './comm-log.service';

describe('CommLogService', () => {
  let service: CommLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommLogService],
    }).compile();

    service = module.get<CommLogService>(CommLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a log entry', () => {
    const entry = service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS',
      targetId: 'CENTRAL',
      protocol: 'DB2DB',
      messageType: 'RECEPTION_INFO',
      dataSize: 1024,
      message: 'Received reception info batch',
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(entry.direction).toBe('INBOUND');
    expect(entry.sourceId).toBe('SIMS');
    expect(entry.level).toBe('INFO');
  });

  it('should filter logs by direction', () => {
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 100, message: 'inbound data',
    });
    service.log({
      direction: 'OUTBOUND',
      sourceId: 'CENTRAL', targetId: 'SIMS',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 200, message: 'outbound data',
    });

    const result = service.getLogs({ direction: 'INBOUND' });
    expect(result.total).toBe(1);
    expect(result.logs[0].direction).toBe('INBOUND');
  });

  it('should filter logs by level', () => {
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 100, message: 'normal log',
    });
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'ERROR',
      dataSize: 0, level: 'ERROR', message: 'error occurred',
    });

    const result = service.getLogs({ level: 'ERROR' });
    expect(result.total).toBe(1);
    expect(result.logs[0].message).toBe('error occurred');
  });

  it('should filter logs by keyword', () => {
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 100, message: 'Reception info received',
    });
    service.log({
      direction: 'OUTBOUND',
      sourceId: 'CENTRAL', targetId: 'SIMS',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 200, message: 'Sorting result sent',
    });

    const result = service.getLogs({ keyword: 'Reception' });
    expect(result.total).toBe(1);
  });

  it('should support pagination', () => {
    for (let i = 0; i < 10; i++) {
      service.log({
        direction: 'INBOUND',
        sourceId: 'SIMS', targetId: 'CENTRAL',
        protocol: 'DB2DB', messageType: 'DATA',
        dataSize: 100, message: `Log ${i}`,
      });
    }

    const page1 = service.getLogs({ limit: 3, offset: 0 });
    expect(page1.logs.length).toBe(3);
    expect(page1.total).toBe(10);

    const page2 = service.getLogs({ limit: 3, offset: 3 });
    expect(page2.logs.length).toBe(3);
  });

  it('should return log statistics', () => {
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 100, message: 'test',
    });

    const stats = service.getLogStats();
    expect(stats.totalLogs).toBe(1);
    expect(stats.byDirection['INBOUND']).toBe(1);
    expect(stats.byLevel['INFO']).toBe(1);
    expect(stats.byProtocol['DB2DB']).toBe(1);
  });

  it('should return recent logs', () => {
    for (let i = 0; i < 30; i++) {
      service.log({
        direction: 'INBOUND',
        sourceId: 'SIMS', targetId: 'CENTRAL',
        protocol: 'DB2DB', messageType: 'DATA',
        dataSize: 100, message: `Log ${i}`,
      });
    }

    const recent = service.getRecentLogs(10);
    expect(recent.length).toBe(10);
  });

  it('should cleanup expired logs', () => {
    // 로그는 메모리에 있으므로 현재 로그는 삭제되지 않음
    service.log({
      direction: 'INBOUND',
      sourceId: 'SIMS', targetId: 'CENTRAL',
      protocol: 'DB2DB', messageType: 'DATA',
      dataSize: 100, message: 'recent log',
    });

    const deleted = service.cleanupExpiredLogs();
    expect(deleted).toBe(0); // 최근 로그이므로 0건 삭제
  });
});
