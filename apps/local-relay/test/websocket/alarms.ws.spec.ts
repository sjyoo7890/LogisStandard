import { Test, TestingModule } from '@nestjs/testing';
import { AlarmsGateway } from '../../src/gateway/alarms.gateway';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 알람 WebSocket 게이트웨이 테스트
 * - 알람 이벤트 스트림
 * - 알람 발생/해제 수신
 * - 다양한 심각도 알람 브로드캐스트
 */
describe('AlarmsGateway WebSocket 테스트', () => {
  let gateway: AlarmsGateway;
  let eqService: EquipmentMonitorService;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlarmsGateway, EquipmentMonitorService],
    }).compile();

    gateway = module.get<AlarmsGateway>(AlarmsGateway);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);

    // WebSocket Server 목 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 알람 리스너 등록
    gateway.afterInit();
  });

  // 테스트 1: 알람 발생 시 WebSocket으로 이벤트 스트림
  it('알람이 발생하면 alarm 이벤트가 WebSocket으로 브로드캐스트되어야 한다', () => {
    // CRITICAL 알람 발생
    eqService.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', '모터 과부하', 'Main');

    // alarm 이벤트 emit 확인
    expect(mockServer.emit).toHaveBeenCalledTimes(1);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'alarm',
      expect.objectContaining({
        equipmentId: 'SORTER-01',
        code: 'A-001',
        severity: 'CRITICAL',
        message: '모터 과부하',
        zone: 'Main',
        active: true,
      }),
    );

    // 추가 알람 발생
    eqService.raiseAlarm('IND-01', 'A-002', 'WARNING', '속도 저하', 'Induction');
    eqService.raiseAlarm('CV-MAIN', 'A-003', 'MAJOR', '벨트 장력 이상', 'Conveyor');

    // 총 3건 emit
    expect(mockServer.emit).toHaveBeenCalledTimes(3);

    // 각 알람의 심각도 확인
    const emittedAlarms = mockServer.emit.mock.calls.map((call: any[]) => call[1]);
    expect(emittedAlarms[0].severity).toBe('CRITICAL');
    expect(emittedAlarms[1].severity).toBe('WARNING');
    expect(emittedAlarms[2].severity).toBe('MAJOR');
  });

  // 테스트 2: 다양한 장비에서 발생하는 알람 스트림
  it('여러 장비에서 발생한 알람이 모두 브로드캐스트되어야 한다', () => {
    // 다양한 장비에서 알람 발생
    const alarmConfigs = [
      { eqId: 'SORTER-01', code: 'A-001', severity: 'CRITICAL' as const, msg: '모터 과부하', zone: 'Main' },
      { eqId: 'IND-01', code: 'A-010', severity: 'WARNING' as const, msg: '진동 감지', zone: 'Induction-1' },
      { eqId: 'IND-02', code: 'A-011', severity: 'INFO' as const, msg: '속도 변동', zone: 'Induction-2' },
      { eqId: 'CV-MAIN', code: 'A-020', severity: 'MAJOR' as const, msg: '벨트 마모', zone: 'Conveyor' },
      { eqId: 'IPS-01', code: 'A-030', severity: 'WARNING' as const, msg: '판독률 저하', zone: 'IPS' },
    ];

    for (const cfg of alarmConfigs) {
      eqService.raiseAlarm(cfg.eqId, cfg.code, cfg.severity, cfg.msg, cfg.zone);
    }

    // 5건 모두 브로드캐스트
    expect(mockServer.emit).toHaveBeenCalledTimes(5);

    // 각 이벤트가 올바른 장비 ID와 연결
    for (let i = 0; i < alarmConfigs.length; i++) {
      const emittedAlarm = mockServer.emit.mock.calls[i][1];
      expect(emittedAlarm.equipmentId).toBe(alarmConfigs[i].eqId);
      expect(emittedAlarm.code).toBe(alarmConfigs[i].code);
      expect(emittedAlarm.message).toBe(alarmConfigs[i].msg);
      expect(emittedAlarm.alarmId).toBeDefined();
      expect(emittedAlarm.occurredAt).toBeDefined();
      expect(emittedAlarm.active).toBe(true);
    }
  });

  // 테스트 3: 알람 발생 후 해제 시나리오 (활성 알람 확인)
  it('알람 발생 후 해제해도 발생 시점의 이벤트는 브로드캐스트된 상태로 유지되어야 한다', () => {
    // 알람 발생
    const alarm1 = eqService.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', '모터 과부하', 'Main');
    const alarm2 = eqService.raiseAlarm('IND-01', 'A-002', 'WARNING', '속도 저하', 'Induction');

    // 2건 브로드캐스트
    expect(mockServer.emit).toHaveBeenCalledTimes(2);

    // 활성 알람 확인
    expect(eqService.getActiveAlarms().length).toBe(2);

    // 알람 해제 (clearAlarm은 알람 리스너를 호출하지 않음 - 발생만 리스닝)
    eqService.clearAlarm(alarm1.alarmId);
    eqService.clearAlarm(alarm2.alarmId);

    // 해제 후에도 emit 횟수는 변경 없음 (해제 이벤트는 별도 브로드캐스트하지 않음)
    expect(mockServer.emit).toHaveBeenCalledTimes(2);

    // 활성 알람 0건
    expect(eqService.getActiveAlarms().length).toBe(0);

    // 전체 알람 이력은 유지
    const allAlarms = eqService.getAllAlarms();
    expect(allAlarms.length).toBe(2);
    expect(allAlarms.every((a) => !a.active)).toBe(true);
    expect(allAlarms.every((a) => a.clearedAt !== undefined)).toBe(true);
  });
});
