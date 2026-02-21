import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService, Alarm } from '../../src/monitoring/monitoring.service';
import { AlarmStreamGateway } from '../../src/gateway/alarm-stream.gateway';

/**
 * WebSocket 알람 스트림 통합 테스트
 * - 알람 이벤트 스트림, 알람 발생/확인/해결 라이프사이클
 */
describe('WebSocket 알람 스트림 테스트 (/ws/alarms)', () => {
  let monitoringService: MonitoringService;
  let gateway: AlarmStreamGateway;
  let module: TestingModule;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [MonitoringService, AlarmStreamGateway],
    }).compile();

    monitoringService = module.get<MonitoringService>(MonitoringService);
    gateway = module.get<AlarmStreamGateway>(AlarmStreamGateway);

    monitoringService.onModuleInit();

    // 모의 WebSocket 서버 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 이벤트 리스너 등록
    gateway.afterInit();
  });

  afterEach(() => {
    monitoringService.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 알람 이벤트 스트림 (alarm 발생)
  // -------------------------------------------------------
  it('알람 발생 시 alarm 이벤트가 WebSocket으로 브로드캐스트되어야 한다', () => {
    // 초기 알람 (onModuleInit에서 2건 생성)
    // afterInit 이전에 생성된 알람은 리스너 등록 전이므로 전송되지 않음
    mockServer.emit.mockClear();

    // 신규 알람 발생
    const alarm = monitoringService.raiseAlarm(
      'CRITICAL',
      'CHT-05',
      '슈트 5',
      '슈트 만재',
      '현재 적재율 100%',
    );

    // alarm 이벤트 전송 확인
    expect(mockServer.emit).toHaveBeenCalledWith('alarm', expect.objectContaining({
      severity: 'CRITICAL',
      status: 'ACTIVE',
      equipmentId: 'CHT-05',
      equipmentName: '슈트 5',
      message: '슈트 만재',
    }));

    // 알람 목록에 추가 확인
    const allAlarms = monitoringService.getAlarms();
    expect(allAlarms.length).toBeGreaterThanOrEqual(3); // 초기 2건 + 신규 1건
  });

  // -------------------------------------------------------
  // 2. 알람 확인(Acknowledge)
  // -------------------------------------------------------
  it('ACTIVE 알람을 확인하면 ACKNOWLEDGED 상태로 전환되어야 한다', () => {
    mockServer.emit.mockClear();

    // 알람 발생
    const alarm = monitoringService.raiseAlarm(
      'WARNING',
      'CNV-01',
      '입구 컨베이어',
      '속도 이상',
      '설정값 대비 20% 저하',
    );

    // 알람 확인
    const ackResult = monitoringService.acknowledgeAlarm(alarm.id);
    expect(ackResult).toBe(true);

    // 상태 확인
    const alarms = monitoringService.getAlarms();
    const acked = alarms.find((a) => a.id === alarm.id);
    expect(acked!.status).toBe('ACKNOWLEDGED');
    expect(acked!.acknowledgedAt).toBeDefined();

    // 이미 ACKNOWLEDGED인 알람 재확인 시도 → false
    const reAck = monitoringService.acknowledgeAlarm(alarm.id);
    expect(reAck).toBe(false);

    // 존재하지 않는 알람 확인 → false
    const nonExistent = monitoringService.acknowledgeAlarm('ALM-NONE');
    expect(nonExistent).toBe(false);
  });

  // -------------------------------------------------------
  // 3. 알람 해결(Resolve) 및 alarm-clear 이벤트
  // -------------------------------------------------------
  it('알람 해결 시 alarm-clear 이벤트가 WebSocket으로 브로드캐스트되어야 한다', () => {
    mockServer.emit.mockClear();

    // 알람 발생
    const alarm = monitoringService.raiseAlarm(
      'WARNING',
      'IND-01',
      '인덕션 1',
      '정체 감지',
      '투입 속도 저하',
    );

    // 알람 확인 후 해결
    monitoringService.acknowledgeAlarm(alarm.id);
    mockServer.emit.mockClear();

    const resolved = monitoringService.resolveAlarm(alarm.id, '정체 해소 완료');
    expect(resolved).toBe(true);

    // alarm-clear 이벤트 전송 확인
    expect(mockServer.emit).toHaveBeenCalledWith('alarm-clear', expect.objectContaining({
      id: alarm.id,
      status: 'RESOLVED',
      actionNote: '정체 해소 완료',
    }));

    // 해결된 알람의 상태 확인
    const alarms = monitoringService.getAlarms();
    const resolvedAlarm = alarms.find((a) => a.id === alarm.id);
    expect(resolvedAlarm!.status).toBe('RESOLVED');
    expect(resolvedAlarm!.resolvedAt).toBeDefined();
    expect(resolvedAlarm!.actionNote).toBe('정체 해소 완료');

    // 이미 RESOLVED인 알람 재해결 시도 → false
    const reResolve = monitoringService.resolveAlarm(alarm.id);
    expect(reResolve).toBe(false);
  });

  // -------------------------------------------------------
  // 4. 알람 라이프사이클 전체 흐름 (발생→확인→해결)
  // -------------------------------------------------------
  it('알람 라이프사이클: ACTIVE → ACKNOWLEDGED → RESOLVED 전체 흐름이 정상 동작해야 한다', () => {
    mockServer.emit.mockClear();

    // 1단계: 알람 발생 (ACTIVE)
    const alarm = monitoringService.raiseAlarm(
      'CRITICAL',
      'PLC-01',
      'PLC 메인',
      'PLC 통신 장애',
      '응답 타임아웃 5초 초과',
    );
    expect(alarm.status).toBe('ACTIVE');
    expect(alarm.severity).toBe('CRITICAL');

    // alarm 이벤트 발생 확인
    const alarmCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'alarm',
    );
    expect(alarmCalls).toHaveLength(1);

    // 활성 알람 수 확인 (초기 2건 + 신규 1건 = 3건)
    expect(monitoringService.getActiveAlarmCount()).toBe(3);

    // 상태별 필터링
    const activeAlarms = monitoringService.getAlarms('ACTIVE');
    expect(activeAlarms).toHaveLength(3);

    // 2단계: 알람 확인 (ACKNOWLEDGED)
    monitoringService.acknowledgeAlarm(alarm.id);
    const ackedAlarms = monitoringService.getAlarms('ACKNOWLEDGED');
    expect(ackedAlarms).toHaveLength(1);
    expect(monitoringService.getActiveAlarmCount()).toBe(2);

    // 3단계: 알람 해결 (RESOLVED)
    monitoringService.resolveAlarm(alarm.id, 'PLC 재기동 완료');
    const resolvedAlarms = monitoringService.getAlarms('RESOLVED');
    expect(resolvedAlarms).toHaveLength(1);
    expect(monitoringService.getActiveAlarmCount()).toBe(2);

    // alarm-clear 이벤트 발생 확인
    const clearCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'alarm-clear',
    );
    expect(clearCalls).toHaveLength(1);
    expect(clearCalls[0][1].actionNote).toBe('PLC 재기동 완료');

    // 종합 상태 확인
    const status = monitoringService.getStatus();
    expect(status.activeAlarms).toBe(2);
    expect(status.totalAlarms).toBeGreaterThanOrEqual(3);
  });
});
