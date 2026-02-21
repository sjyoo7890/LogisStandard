import { Test, TestingModule } from '@nestjs/testing';
import { OperationService } from '../../src/operation/operation.service';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';
import { SimulatorService } from '../../src/simulator/simulator.service';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 운영 모드 전환 통합 테스트
 * - SIMULATOR -> OPERATION 모드 전환
 * - OPERATION -> SIMULATOR 모드 전환
 * - 안전 검사 통과/실패
 * - 모드 이력 조회
 */
describe('운영 모드 전환(Mode Switch) 통합 테스트', () => {
  let operationService: OperationService;
  let plcService: PLCConnectionService;
  let simService: SimulatorService;
  let eqService: EquipmentMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationService,
        PLCConnectionService,
        SimulatorService,
        EquipmentMonitorService,
      ],
    }).compile();

    operationService = module.get<OperationService>(OperationService);
    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    simService = module.get<SimulatorService>(SimulatorService);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);

    plcService.onModuleInit();
  });

  afterEach(() => {
    simService.stop();
    plcService.onModuleDestroy();
  });

  // 테스트 1: SIMULATOR → OPERATION 모드 전환
  it('SIMULATOR에서 OPERATION 모드로 전환하면 시뮬레이터가 정지되고 PLC가 연결되어야 한다', async () => {
    // 초기 상태 확인
    expect(operationService.getCurrentMode()).toBe('SIMULATOR');
    expect(plcService.getConnectedCount()).toBe(0);

    // 시뮬레이터를 먼저 시작
    simService.start(1000);
    expect(simService.isRunning()).toBe(true);

    // OPERATION 모드로 전환
    const result = await operationService.switchMode('OPERATION', 'operator1', '운영 시작');
    expect(result.success).toBe(true);
    expect(result.safetyCheck.passed).toBe(true);
    expect(operationService.getCurrentMode()).toBe('OPERATION');

    // 시뮬레이터 정지 확인
    expect(simService.isRunning()).toBe(false);

    // PLC 전체 채널 연결 확인
    expect(plcService.getConnectedCount()).toBe(7);

    // 운영 상태 확인
    const status = operationService.getStatus();
    expect(status.mode).toBe('OPERATION');
    expect(status.plcConnected).toBe(7);
    expect(status.simulatorRunning).toBe(false);
  });

  // 테스트 2: OPERATION → SIMULATOR 모드 전환
  it('OPERATION에서 SIMULATOR 모드로 전환하면 PLC가 해제되어야 한다', async () => {
    // OPERATION 모드로 먼저 전환
    await operationService.switchMode('OPERATION', 'admin', '운영 시작');
    expect(operationService.getCurrentMode()).toBe('OPERATION');
    expect(plcService.getConnectedCount()).toBe(7);

    // SIMULATOR 모드로 전환
    const result = await operationService.switchMode('SIMULATOR', 'admin', '시뮬레이터 복귀');
    expect(result.success).toBe(true);
    expect(operationService.getCurrentMode()).toBe('SIMULATOR');

    // PLC 연결 해제 확인
    expect(plcService.getConnectedCount()).toBe(0);

    // 동일 모드로 재전환 시 실패
    const sameMode = await operationService.switchMode('SIMULATOR', 'admin', '중복 전환');
    expect(sameMode.success).toBe(false);
    expect(sameMode.error).toContain('Already in SIMULATOR mode');
  });

  // 테스트 3: 안전 검사 실패 시 모드 전환 차단
  it('치명적 알람이 있으면 안전 검사 실패로 모드 전환이 차단되어야 한다', async () => {
    // CRITICAL 알람 발생
    eqService.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', '모터 과부하', 'Main');

    // 안전 검사 실패로 OPERATION 전환 차단
    const result = await operationService.switchMode('OPERATION', 'admin', '운영 시작 시도');
    expect(result.success).toBe(false);
    expect(result.safetyCheck.passed).toBe(false);
    expect(result.error).toBe('Safety check failed');

    // 안전 검사 상세 확인
    const criticalCheck = result.safetyCheck.checks.find((c) => c.name === '치명적 알람 없음');
    expect(criticalCheck).toBeDefined();
    expect(criticalCheck!.passed).toBe(false);

    // 현재 모드 변경 없음
    expect(operationService.getCurrentMode()).toBe('SIMULATOR');

    // 알람 해제 후 재시도
    const activeAlarms = eqService.getActiveAlarms();
    for (const alarm of activeAlarms) {
      eqService.clearAlarm(alarm.alarmId);
    }
    // 장비 에러 상태도 복구 필요
    eqService.updateStatus('SORTER-01', { status: 'STOPPED' });

    const retryResult = await operationService.switchMode('OPERATION', 'admin', '재시도');
    expect(retryResult.success).toBe(true);
    expect(operationService.getCurrentMode()).toBe('OPERATION');
  });

  // 테스트 4: 모드 이력 조회
  it('모드 전환 이력이 정확하게 기록되어야 한다', async () => {
    // 1차 전환: SIMULATOR → OPERATION
    await operationService.switchMode('OPERATION', 'admin', '운영 시작');

    // 2차 전환: OPERATION → SIMULATOR
    await operationService.switchMode('SIMULATOR', 'operator1', '점검을 위한 복귀');

    // 3차 전환: SIMULATOR → OPERATION
    await operationService.switchMode('OPERATION', 'operator2', '운영 재개');

    // 이력 조회 (최신순)
    const history = operationService.getModeHistory();
    expect(history.length).toBe(3);

    // 최신 이력 확인
    expect(history[0].from).toBe('SIMULATOR');
    expect(history[0].to).toBe('OPERATION');
    expect(history[0].switchedBy).toBe('operator2');
    expect(history[0].reason).toBe('운영 재개');
    expect(history[0].safetyCheckPassed).toBe(true);
    expect(history[0].switchedAt).toBeDefined();

    // 두 번째 이력
    expect(history[1].from).toBe('OPERATION');
    expect(history[1].to).toBe('SIMULATOR');
    expect(history[1].switchedBy).toBe('operator1');

    // 첫 번째 이력
    expect(history[2].from).toBe('SIMULATOR');
    expect(history[2].to).toBe('OPERATION');
    expect(history[2].switchedBy).toBe('admin');
  });
});
