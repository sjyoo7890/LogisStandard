import { Test, TestingModule } from '@nestjs/testing';
import { RelayConfigService } from './relay-config.service';

describe('RelayConfigService', () => {
  let service: RelayConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelayConfigService],
    }).compile();

    service = module.get<RelayConfigService>(RelayConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return full config', () => {
    const config = service.getConfig();
    expect(config).toHaveProperty('sims');
    expect(config).toHaveProperty('centers');
    expect(config).toHaveProperty('protocol');
    expect(config).toHaveProperty('sync');
  });

  it('should have 5 default centers', () => {
    const config = service.getConfig();
    expect(config.centers.length).toBe(5);
  });

  it('should include all 5 major centers', () => {
    const centers = service.getActiveCenters();
    const ids = centers.map((c) => c.centerId);
    expect(ids).toContain('SEOUL');
    expect(ids).toContain('BUSAN');
    expect(ids).toContain('DAEGU');
    expect(ids).toContain('GWANGJU');
    expect(ids).toContain('DAEJEON');
  });

  it('should get specific center config', () => {
    const seoul = service.getCenterConfig('SEOUL');
    expect(seoul).toBeDefined();
    expect(seoul?.centerName).toBe('서울우편집중국');
  });

  it('should return undefined for unknown center', () => {
    const unknown = service.getCenterConfig('UNKNOWN');
    expect(unknown).toBeUndefined();
  });

  it('should update center config', () => {
    const result = service.updateCenterConfig('SEOUL', {
      host: '10.10.1.200',
      port: 3200,
    });
    expect(result).not.toBeNull();
    expect(result?.host).toBe('10.10.1.200');
    expect(result?.port).toBe(3200);
  });

  it('should return null when updating unknown center', () => {
    const result = service.updateCenterConfig('UNKNOWN', { host: '1.2.3.4' });
    expect(result).toBeNull();
  });

  it('should update global config', () => {
    const updated = service.updateConfig({
      sims: { heartbeatIntervalMs: 5000 } as any,
    });
    expect(updated.sims.heartbeatIntervalMs).toBe(5000);
  });

  it('should get SIMS config', () => {
    const sims = service.getSimsConfig();
    expect(sims).toHaveProperty('host');
    expect(sims).toHaveProperty('port');
    expect(sims).toHaveProperty('heartbeatIntervalMs');
  });

  it('should get only active centers', () => {
    service.updateCenterConfig('BUSAN', { enabled: false });
    const active = service.getActiveCenters();
    expect(active.length).toBe(4);
    expect(active.find((c) => c.centerId === 'BUSAN')).toBeUndefined();
  });
});
