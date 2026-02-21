import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionService } from './connection.service';

// 외부 연결 차단을 위한 모킹
jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => {
    const events: Record<string, Function> = {};
    return {
      on: jest.fn((event: string, cb: Function) => { events[event] = cb; }),
      setTimeout: jest.fn(),
      connect: jest.fn(() => {
        // 기본적으로 연결 실패 시뮬레이션
        setTimeout(() => events['error']?.(), 10);
      }),
      destroy: jest.fn(),
    };
  }),
}));

describe('ConnectionService', () => {
  let service: ConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionService],
    }).compile();

    service = module.get<ConnectionService>(ConnectionService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with default connection targets', () => {
    const connections = service.getAllConnections();
    expect(connections.length).toBeGreaterThanOrEqual(6);
    expect(connections.find(c => c.target.id === 'SIMS')).toBeDefined();
    expect(connections.find(c => c.target.id === 'SEOUL')).toBeDefined();
    expect(connections.find(c => c.target.id === 'BUSAN')).toBeDefined();
    expect(connections.find(c => c.target.id === 'DAEGU')).toBeDefined();
    expect(connections.find(c => c.target.id === 'GWANGJU')).toBeDefined();
    expect(connections.find(c => c.target.id === 'DAEJEON')).toBeDefined();
  });

  it('should return system status', () => {
    const status = service.getSystemStatus();
    expect(status).toHaveProperty('overall');
    expect(status).toHaveProperty('simsConnected');
    expect(status).toHaveProperty('connectedCenters');
    expect(status).toHaveProperty('totalCenters');
    expect(status).toHaveProperty('connections');
    expect(status.totalCenters).toBe(5);
  });

  it('should return CRITICAL when SIMS is disconnected', () => {
    const status = service.getSystemStatus();
    // SIMS가 연결되지 않았으므로 CRITICAL
    expect(status.overall).toBe('CRITICAL');
    expect(status.simsConnected).toBe(false);
  });

  it('should get specific connection', () => {
    const sims = service.getConnection('SIMS');
    expect(sims).toBeDefined();
    expect(sims?.target.type).toBe('SIMS');
  });

  it('should return undefined for unknown target', () => {
    const unknown = service.getConnection('UNKNOWN');
    expect(unknown).toBeUndefined();
  });

  it('should update connection target', () => {
    const result = service.updateTarget('SEOUL', { host: '10.10.1.200' });
    expect(result).toBe(true);
    const seoul = service.getConnection('SEOUL');
    expect(seoul?.target.host).toBe('10.10.1.200');
  });

  it('should return false when updating unknown target', () => {
    const result = service.updateTarget('UNKNOWN', { host: '10.10.1.200' });
    expect(result).toBe(false);
  });

  it('should check if SIMS is connected', () => {
    expect(service.isSimsConnected()).toBe(false);
  });
});
