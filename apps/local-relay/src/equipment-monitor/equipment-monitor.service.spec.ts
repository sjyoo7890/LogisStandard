import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentMonitorService } from './equipment-monitor.service';

describe('EquipmentMonitorService', () => {
  let service: EquipmentMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentMonitorService],
    }).compile();

    service = module.get<EquipmentMonitorService>(EquipmentMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 9 equipment entries', () => {
    const all = service.getAllEquipment();
    expect(all.length).toBe(9);
  });

  it('should update equipment status', () => {
    const result = service.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120 });
    expect(result).not.toBeNull();
    expect(result?.status).toBe('RUNNING');
    expect(result?.speed).toBe(120);
  });

  it('should return null for unknown equipment', () => {
    const result = service.updateStatus('UNKNOWN', { status: 'RUNNING' });
    expect(result).toBeNull();
  });

  it('should get equipment by type', () => {
    const conveyors = service.getEquipmentByType('CONVEYOR');
    expect(conveyors.length).toBe(2);
  });

  it('should raise alarm', () => {
    const alarm = service.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', 'Motor overload', 'Main');
    expect(alarm.alarmId).toBeDefined();
    expect(alarm.active).toBe(true);
    expect(alarm.severity).toBe('CRITICAL');
    const eq = service.getEquipment('SORTER-01');
    expect(eq?.status).toBe('ERROR');
  });

  it('should clear alarm', () => {
    const alarm = service.raiseAlarm('IND-01', 'A-002', 'WARNING', 'Speed low', 'Induction');
    const result = service.clearAlarm(alarm.alarmId);
    expect(result).toBe(true);
    const cleared = service.getAllAlarms().find((a) => a.alarmId === alarm.alarmId);
    expect(cleared?.active).toBe(false);
  });

  it('should return active alarms only', () => {
    service.raiseAlarm('IND-01', 'A-001', 'WARNING', 'Test alarm 1', 'Zone1');
    const alarm2 = service.raiseAlarm('IND-02', 'A-002', 'WARNING', 'Test alarm 2', 'Zone2');
    service.clearAlarm(alarm2.alarmId);
    expect(service.getActiveAlarms().length).toBe(1);
  });

  it('should fire status change listener', () => {
    let changed = false;
    service.onStatusChange(() => { changed = true; });
    service.updateStatus('SORTER-01', { status: 'RUNNING' });
    expect(changed).toBe(true);
  });

  it('should return system overview', () => {
    const overview = service.getSystemOverview();
    expect(overview).toHaveProperty('totalEquipment');
    expect(overview).toHaveProperty('running');
    expect(overview).toHaveProperty('stopped');
    expect(overview).toHaveProperty('activeAlarms');
    expect(overview.totalEquipment).toBe(9);
  });

  it('should increment processed count', () => {
    service.incrementProcessed('SORTER-01', 100);
    const eq = service.getEquipment('SORTER-01');
    expect(eq?.processedCount).toBe(100);
  });
});
