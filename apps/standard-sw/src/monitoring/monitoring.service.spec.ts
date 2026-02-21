import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
  let service: MonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonitoringService],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize layout with correct equipment counts', () => {
    const layout = service.getLayout();
    expect(layout.tracks.length).toBe(2);
    expect(layout.inductions.length).toBe(2);
    expect(layout.chutes.length).toBe(20);
    expect(layout.conveyors.length).toBe(3);
  });

  it('should have 20 chute states', () => {
    const chutes = service.getAllChuteStates();
    expect(chutes.length).toBe(20);
  });

  it('should get individual chute state', () => {
    const chute = service.getChuteState(1);
    expect(chute).toBeDefined();
    expect(chute!.chuteNumber).toBe(1);
  });

  it('should raise an alarm', () => {
    const alarm = service.raiseAlarm('CRITICAL', 'CHT-01', '슈트 1', '만재', '용량 초과');
    expect(alarm.severity).toBe('CRITICAL');
    expect(alarm.status).toBe('ACTIVE');
  });

  it('should acknowledge an alarm', () => {
    const alarm = service.raiseAlarm('WARNING', 'IND-01', '인덕션 1', '속도 저하', '속도 50%');
    const success = service.acknowledgeAlarm(alarm.id);
    expect(success).toBe(true);
    const alarms = service.getAlarms('ACKNOWLEDGED');
    expect(alarms.some((a) => a.id === alarm.id)).toBe(true);
  });

  it('should resolve an alarm with action note', () => {
    const alarm = service.raiseAlarm('INFO', 'CNV-01', '컨베이어 1', '점검 필요', '예방정비');
    service.resolveAlarm(alarm.id, '정비 완료');
    const resolved = service.getAlarms('RESOLVED');
    const found = resolved.find((a) => a.id === alarm.id);
    expect(found).toBeDefined();
    expect(found!.actionNote).toBe('정비 완료');
  });

  it('should have initial sample alarms', () => {
    const alarms = service.getAlarms();
    expect(alarms.length).toBeGreaterThanOrEqual(2);
  });

  it('should have 4 comm statuses', () => {
    const statuses = service.getCommStatuses();
    expect(statuses.length).toBe(4);
  });

  it('should return monitoring status summary', () => {
    const status = service.getStatus();
    expect(status).toHaveProperty('layout');
    expect(status).toHaveProperty('activeAlarms');
    expect(status).toHaveProperty('commDevices');
    expect(status.commDevices).toBe(4);
  });
});
