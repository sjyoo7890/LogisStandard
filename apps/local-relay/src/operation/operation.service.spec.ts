import { Test, TestingModule } from '@nestjs/testing';
import { OperationService } from './operation.service';
import { PLCConnectionService } from '../plc-connection/plc-connection.service';
import { SimulatorService } from '../simulator/simulator.service';
import { EquipmentMonitorService } from '../equipment-monitor/equipment-monitor.service';

describe('OperationService', () => {
  let service: OperationService;
  let plcService: PLCConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperationService, PLCConnectionService, SimulatorService, EquipmentMonitorService],
    }).compile();

    service = module.get<OperationService>(OperationService);
    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    plcService.onModuleInit();
  });

  afterEach(() => {
    plcService.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start in SIMULATOR mode', () => {
    expect(service.getCurrentMode()).toBe('SIMULATOR');
  });

  it('should switch to OPERATION mode', async () => {
    const result = await service.switchMode('OPERATION', 'admin', 'Test switch');
    expect(result.success).toBe(true);
    expect(service.getCurrentMode()).toBe('OPERATION');
  });

  it('should switch back to SIMULATOR mode', async () => {
    await service.switchMode('OPERATION', 'admin', 'To operation');
    const result = await service.switchMode('SIMULATOR', 'admin', 'Back to simulator');
    expect(result.success).toBe(true);
    expect(service.getCurrentMode()).toBe('SIMULATOR');
  });

  it('should fail to switch to same mode', async () => {
    const result = await service.switchMode('SIMULATOR', 'admin', 'Same mode');
    expect(result.success).toBe(false);
  });

  it('should record mode history', async () => {
    await service.switchMode('OPERATION', 'admin', 'Test');
    const history = service.getModeHistory();
    expect(history.length).toBe(1);
    expect(history[0].from).toBe('SIMULATOR');
    expect(history[0].to).toBe('OPERATION');
  });

  it('should block switch when critical alarms exist', async () => {
    const eqService = (service as any).eqService as EquipmentMonitorService;
    eqService.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', 'Emergency', 'Main');
    const result = await service.switchMode('OPERATION', 'admin', 'Test');
    expect(result.success).toBe(false);
    expect(result.safetyCheck.passed).toBe(false);
  });

  it('should return operation status', () => {
    const status = service.getStatus();
    expect(status).toHaveProperty('mode');
    expect(status).toHaveProperty('plcConnected');
    expect(status).toHaveProperty('simulatorRunning');
    expect(status).toHaveProperty('activeAlarms');
  });
});
