import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentStatusGateway } from '../../src/gateway/equipment-status.gateway';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 장비 상태 WebSocket 게이트웨이 테스트
 * - 장비 상태 브로드캐스트
 * - 상태 업데이트 수신
 * - 주기적 개요/장비 목록 브로드캐스트
 */
describe('EquipmentStatusGateway WebSocket 테스트', () => {
  let gateway: EquipmentStatusGateway;
  let eqService: EquipmentMonitorService;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EquipmentStatusGateway, EquipmentMonitorService],
    }).compile();

    gateway = module.get<EquipmentStatusGateway>(EquipmentStatusGateway);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);

    // WebSocket Server 목 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 리스너 등록 및 브로드캐스트 인터벌 시작
    gateway.afterInit();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // 테스트 1: 장비 상태 변경 시 실시간 브로드캐스트
  it('장비 상태가 변경되면 status-change 이벤트가 브로드캐스트되어야 한다', () => {
    // 구분기 가동
    eqService.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120 });

    // status-change 이벤트 확인
    const statusChangeCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'status-change',
    );
    expect(statusChangeCalls.length).toBe(1);

    const emittedData = statusChangeCalls[0][1];
    expect(emittedData.equipmentId).toBe('SORTER-01');
    expect(emittedData.status).toBe('RUNNING');
    expect(emittedData.speed).toBe(120);

    // 인덕션 가동
    eqService.updateStatus('IND-01', { status: 'RUNNING', speed: 80 });

    const statusChangeCalls2 = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'status-change',
    );
    expect(statusChangeCalls2.length).toBe(2);
    expect(statusChangeCalls2[1][1].equipmentId).toBe('IND-01');
  });

  // 테스트 2: 주기적 개요 및 장비 목록 브로드캐스트 (3초 간격)
  it('3초마다 시스템 개요와 장비 목록이 브로드캐스트되어야 한다', () => {
    // 장비 상태 변경
    eqService.updateStatus('SORTER-01', { status: 'RUNNING' });
    eqService.incrementProcessed('SORTER-01', 100);

    // 3초 경과
    jest.advanceTimersByTime(3000);

    // overview 이벤트 확인
    const overviewCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'overview',
    );
    expect(overviewCalls.length).toBe(1);

    const overview = overviewCalls[0][1];
    expect(overview.totalEquipment).toBe(9);
    expect(overview.running).toBe(1);
    expect(overview.totalProcessed).toBe(100);

    // equipment 이벤트 확인
    const equipmentCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'equipment',
    );
    expect(equipmentCalls.length).toBe(1);

    const equipmentList = equipmentCalls[0][1];
    expect(equipmentList.length).toBe(9);

    // 6초 경과 → 두 번째 브로드캐스트
    jest.advanceTimersByTime(3000);
    const overviewCalls2 = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'overview',
    );
    expect(overviewCalls2.length).toBe(2);
  });

  // 테스트 3: 상태 변경과 주기적 브로드캐스트 동시 동작
  it('실시간 상태 변경 이벤트와 주기적 브로드캐스트가 동시에 동작해야 한다', () => {
    // 다수 장비 상태 변경
    eqService.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120 });
    eqService.updateStatus('IND-01', { status: 'RUNNING' });
    eqService.updateStatus('CV-MAIN', { status: 'RUNNING', speed: 150 });

    // 실시간 이벤트: 3건의 status-change
    const statusChangeCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'status-change',
    );
    expect(statusChangeCalls.length).toBe(3);

    // 3초 경과 → 주기적 브로드캐스트
    jest.advanceTimersByTime(3000);

    // overview 브로드캐스트: running=3 반영
    const overviewCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'overview',
    );
    expect(overviewCalls.length).toBe(1);
    expect(overviewCalls[0][1].running).toBe(3);

    // equipment 브로드캐스트: 9개 장비 전체 목록
    const equipmentCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'equipment',
    );
    expect(equipmentCalls.length).toBe(1);

    // 전체 emit 카운트: 3(status-change) + 1(overview) + 1(equipment) = 5
    expect(mockServer.emit).toHaveBeenCalledTimes(5);
  });
});
