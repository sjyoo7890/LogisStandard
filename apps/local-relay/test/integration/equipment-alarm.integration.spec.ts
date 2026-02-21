import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentMonitorService, EquipmentState, AlarmEvent } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 장비 상태/알람 통합 테스트
 * - 장비 상태 업데이트
 * - 알람 발생/해제
 * - 알람 리스너
 * - 시스템 개요
 */
describe('장비 상태/알람(Equipment Alarm) 통합 테스트', () => {
  let service: EquipmentMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentMonitorService],
    }).compile();

    service = module.get<EquipmentMonitorService>(EquipmentMonitorService);
  });

  // 테스트 1: 장비 상태 업데이트 및 이벤트 발행
  it('장비 상태를 업데이트하면 리스너에 이벤트가 전달되어야 한다', () => {
    const statusChanges: EquipmentState[] = [];

    // 상태 변경 리스너 등록
    service.onStatusChange((eq) => {
      statusChanges.push({ ...eq });
    });

    // 초기: 9개 장비 확인
    expect(service.getAllEquipment().length).toBe(9);

    // 구분기 가동
    const sorter = service.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120, temperature: 35 });
    expect(sorter).not.toBeNull();
    expect(sorter!.status).toBe('RUNNING');
    expect(sorter!.speed).toBe(120);
    expect(sorter!.temperature).toBe(35);

    // 인덕션 가동
    service.updateStatus('IND-01', { status: 'RUNNING', speed: 80 });
    service.updateStatus('IND-02', { status: 'RUNNING', speed: 80 });

    // 컨베이어 가동
    service.updateStatus('CV-MAIN', { status: 'RUNNING', speed: 150, temperature: 30 });

    // 상태 변경 이벤트 확인 (4개 장비의 상태가 변경됨)
    expect(statusChanges.length).toBe(4);
    expect(statusChanges[0].equipmentId).toBe('SORTER-01');
    expect(statusChanges[0].status).toBe('RUNNING');

    // 타입별 장비 조회
    const conveyors = service.getEquipmentByType('CONVEYOR');
    expect(conveyors.length).toBe(2);

    const inductions = service.getEquipmentByType('INDUCTION');
    expect(inductions.length).toBe(2);
    expect(inductions.filter((i) => i.status === 'RUNNING').length).toBe(2);

    // 존재하지 않는 장비 업데이트
    expect(service.updateStatus('UNKNOWN', { status: 'RUNNING' })).toBeNull();
  });

  // 테스트 2: 알람 발생 및 해제 전체 사이클
  it('알람 발생 → 장비 에러 상태 반영 → 알람 해제 전체 사이클이 동작해야 한다', () => {
    // CRITICAL 알람 발생 → 장비 에러 상태 전환
    const alarm1 = service.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', '모터 과부하', 'Main');
    expect(alarm1.alarmId).toBeDefined();
    expect(alarm1.active).toBe(true);
    expect(alarm1.severity).toBe('CRITICAL');

    // 장비 에러 상태 확인
    const sorter = service.getEquipment('SORTER-01');
    expect(sorter!.status).toBe('ERROR');
    expect(sorter!.errorCount).toBe(1);

    // WARNING 알람 (장비 에러 상태로 전환하지 않음)
    const alarm2 = service.raiseAlarm('IND-01', 'A-002', 'WARNING', '속도 저하', 'Induction');
    expect(alarm2.severity).toBe('WARNING');
    // WARNING은 장비 상태를 ERROR로 변경하지 않음
    expect(service.getEquipment('IND-01')!.status).not.toBe('ERROR');

    // 활성 알람 조회
    const activeAlarms = service.getActiveAlarms();
    expect(activeAlarms.length).toBe(2);

    // 알람 해제
    expect(service.clearAlarm(alarm1.alarmId)).toBe(true);
    expect(service.getActiveAlarms().length).toBe(1);

    // 해제된 알람 확인
    const clearedAlarm = service.getAllAlarms().find((a) => a.alarmId === alarm1.alarmId);
    expect(clearedAlarm!.active).toBe(false);
    expect(clearedAlarm!.clearedAt).toBeDefined();

    // 이미 해제된 알람 재해제 시도 → 실패
    expect(service.clearAlarm(alarm1.alarmId)).toBe(false);

    // 두 번째 알람도 해제
    expect(service.clearAlarm(alarm2.alarmId)).toBe(true);
    expect(service.getActiveAlarms().length).toBe(0);
  });

  // 테스트 3: 알람 리스너 이벤트 수신
  it('알람 리스너가 알람 발생 시 정확한 이벤트를 수신해야 한다', () => {
    const alarmEvents: AlarmEvent[] = [];

    // 알람 리스너 등록
    service.onAlarm((alarm) => {
      alarmEvents.push({ ...alarm });
    });

    // 다양한 심각도의 알람 발생
    service.raiseAlarm('SORTER-01', 'A-001', 'CRITICAL', '모터 과부하', 'Main');
    service.raiseAlarm('IND-01', 'A-002', 'MAJOR', '진동 감지', 'Induction');
    service.raiseAlarm('CV-MAIN', 'A-003', 'WARNING', '벨트 마모', 'Conveyor');
    service.raiseAlarm('IPS-01', 'A-004', 'INFO', '판독률 감소', 'IPS');

    // 4건 이벤트 수신 확인
    expect(alarmEvents.length).toBe(4);

    // 심각도별 확인
    expect(alarmEvents[0].severity).toBe('CRITICAL');
    expect(alarmEvents[0].equipmentId).toBe('SORTER-01');
    expect(alarmEvents[1].severity).toBe('MAJOR');
    expect(alarmEvents[2].severity).toBe('WARNING');
    expect(alarmEvents[3].severity).toBe('INFO');

    // 알람 코드 및 메시지 확인
    expect(alarmEvents[0].code).toBe('A-001');
    expect(alarmEvents[0].message).toBe('모터 과부하');
    expect(alarmEvents[0].zone).toBe('Main');
    expect(alarmEvents[0].active).toBe(true);
    expect(alarmEvents[0].occurredAt).toBeDefined();
  });

  // 테스트 4: 시스템 개요 및 처리 통계
  it('시스템 개요가 전체 장비 상태를 정확히 반영해야 한다', () => {
    // 초기 시스템 개요
    let overview = service.getSystemOverview();
    expect(overview.totalEquipment).toBe(9);
    expect(overview.running).toBe(0);
    expect(overview.stopped).toBeGreaterThan(0);
    expect(overview.error).toBe(0);
    expect(overview.activeAlarms).toBe(0);
    expect(overview.totalProcessed).toBe(0);

    // 장비 가동
    service.updateStatus('SORTER-01', { status: 'RUNNING' });
    service.updateStatus('IND-01', { status: 'RUNNING' });
    service.updateStatus('IND-02', { status: 'RUNNING' });
    service.updateStatus('CV-MAIN', { status: 'RUNNING' });

    // 처리 카운트 증가
    service.incrementProcessed('SORTER-01', 500);
    service.incrementProcessed('IND-01', 250);
    service.incrementProcessed('IND-02', 250);

    // 알람 발생
    service.raiseAlarm('IPS-01', 'A-010', 'WARNING', '판독률 저하', 'IPS');
    service.raiseAlarm('OCR-01', 'A-011', 'CRITICAL', 'OCR 인식 실패', 'OCR');

    // 시스템 개요 확인
    overview = service.getSystemOverview();
    expect(overview.running).toBe(4);
    expect(overview.error).toBe(1); // CRITICAL 알람으로 OCR-01이 ERROR 상태
    expect(overview.activeAlarms).toBe(2);
    expect(overview.totalProcessed).toBe(1000); // 500 + 250 + 250

    // 전체 알람 이력 (limit 적용)
    const allAlarms = service.getAllAlarms(10);
    expect(allAlarms.length).toBe(2);
  });
});
