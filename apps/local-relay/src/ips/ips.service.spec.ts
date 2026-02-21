import { Test, TestingModule } from '@nestjs/testing';
import { IPSService } from './ips.service';

describe('IPSService', () => {
  let service: IPSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IPSService],
    }).compile();

    service = module.get<IPSService>(IPSService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have 4 default devices', () => {
    const devices = service.getAllDevices();
    expect(devices.length).toBe(4);
  });

  it('should process a successful barcode read', () => {
    const result = service.processRead('IPS-IND01', '4201234567890', 'CODE128', 95, 92, 12);
    expect(result.status).toBe('SUCCESS');
    expect(result.barcode).toBe('4201234567890');
    expect(result.confidence).toBe(95);
  });

  it('should detect NO_READ for empty barcode', () => {
    const result = service.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    expect(result.status).toBe('NO_READ');
  });

  it('should detect MULTI_READ', () => {
    const result = service.processRead('IPS-IND01', '420123/630123', 'CODE128', 72, 60, 22);
    expect(result.status).toBe('MULTI_READ');
  });

  it('should track success rate per device', () => {
    service.processRead('IPS-IND01', '420123', 'CODE128', 95, 90, 10);
    service.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    const device = service.getDevice('IPS-IND01');
    expect(device?.totalReads).toBe(2);
    expect(device?.successReads).toBe(1);
    expect(device?.successRate).toBe(50);
  });

  it('should add and clear alarms', () => {
    service.addAlarm('IPS-IND01', 'Sensor blocked');
    let device = service.getDevice('IPS-IND01');
    expect(device?.alarms.length).toBe(1);
    expect(device?.status).toBe('ERROR');

    service.clearAlarms('IPS-IND01');
    device = service.getDevice('IPS-IND01');
    expect(device?.alarms.length).toBe(0);
    expect(device?.status).toBe('ONLINE');
  });

  it('should return read history', () => {
    service.processRead('IPS-IND01', '420123', 'CODE128', 95, 90, 10);
    const history = service.getReadHistory();
    expect(history.length).toBe(1);
  });

  it('should return overall stats', () => {
    const stats = service.getOverallStats();
    expect(stats).toHaveProperty('totalReads');
    expect(stats).toHaveProperty('successRate');
    expect(stats).toHaveProperty('avgReadTime');
  });
});
