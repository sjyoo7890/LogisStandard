import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from '../../src/monitoring/monitoring.service';
import { EquipmentStreamGateway } from '../../src/gateway/equipment-stream.gateway';

/**
 * WebSocket 장비 상태 스트림 통합 테스트
 * - 장비 상태 브로드캐스트, 레이아웃 업데이트
 */
describe('WebSocket 장비 상태 스트림 테스트 (/ws/equipment-status)', () => {
  let monitoringService: MonitoringService;
  let gateway: EquipmentStreamGateway;
  let module: TestingModule;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [MonitoringService, EquipmentStreamGateway],
    }).compile();

    monitoringService = module.get<MonitoringService>(MonitoringService);
    gateway = module.get<EquipmentStreamGateway>(EquipmentStreamGateway);

    monitoringService.onModuleInit();

    // 모의 WebSocket 서버 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 이벤트 리스너/타이머 등록
    gateway.afterInit();
  });

  afterEach(() => {
    // broadcastInterval 정리
    if ((gateway as any).broadcastInterval) {
      clearInterval((gateway as any).broadcastInterval);
    }
    monitoringService.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 장비 상태 브로드캐스트 (주기적)
  // -------------------------------------------------------
  it('주기적으로 layout과 comm-status가 브로드캐스트되어야 한다', (done) => {
    // broadcastInterval (3초) 대기 후 확인
    setTimeout(() => {
      const layoutCalls = mockServer.emit.mock.calls.filter(
        (call: any[]) => call[0] === 'layout',
      );
      expect(layoutCalls.length).toBeGreaterThanOrEqual(1);

      // 레이아웃 데이터 구조 확인
      const layout = layoutCalls[layoutCalls.length - 1][1];
      expect(layout).toHaveProperty('tracks');
      expect(layout).toHaveProperty('inductions');
      expect(layout).toHaveProperty('chutes');
      expect(layout).toHaveProperty('conveyors');
      expect(layout.tracks).toHaveLength(2);
      expect(layout.inductions).toHaveLength(2);
      expect(layout.chutes).toHaveLength(20);
      expect(layout.conveyors).toHaveLength(3);

      // 통신 상태 브로드캐스트 확인
      const commCalls = mockServer.emit.mock.calls.filter(
        (call: any[]) => call[0] === 'comm-status',
      );
      expect(commCalls.length).toBeGreaterThanOrEqual(1);

      const commStatuses = commCalls[commCalls.length - 1][1];
      expect(commStatuses).toHaveLength(4);
      expect(commStatuses.every((c: any) => c.connected === true)).toBe(true);
      done();
    }, 3500);
  });

  // -------------------------------------------------------
  // 2. 레이아웃 데이터 정합성 확인
  // -------------------------------------------------------
  it('레이아웃 데이터가 모든 장비 정보를 올바르게 포함해야 한다', () => {
    const layout = monitoringService.getLayout();

    // 트랙
    expect(layout.tracks).toHaveLength(2);
    expect(layout.tracks[0].id).toBe('TRK-01');
    expect(layout.tracks[0].type).toBe('TRACK');
    expect(layout.tracks[0].status).toBe('RUNNING');

    // 인덕션
    expect(layout.inductions).toHaveLength(2);
    expect(layout.inductions[0].id).toBe('IND-01');
    expect(layout.inductions[0].type).toBe('INDUCTION');

    // 슈트 (20개)
    expect(layout.chutes).toHaveLength(20);
    expect(layout.chutes[0].id).toBe('CHT-01');
    expect(layout.chutes[19].id).toBe('CHT-20');
    expect(layout.chutes.every((c) => c.type === 'CHUTE')).toBe(true);

    // 컨베이어
    expect(layout.conveyors).toHaveLength(3);
    expect(layout.conveyors.map((c) => c.id)).toEqual(['CNV-01', 'CNV-02', 'CNV-03']);

    // 레이아웃 요약
    const summary = monitoringService.getLayoutSummary();
    expect(summary.totalEquipment).toBe(27); // 2+2+20+3
    expect(summary.running).toBe(27);
    expect(summary.stopped).toBe(0);
    expect(summary.error).toBe(0);
  });

  // -------------------------------------------------------
  // 3. 슈트 상태 업데이트가 서비스에 반영되는지 확인
  // -------------------------------------------------------
  it('슈트 상태 업데이트가 올바르게 반영되어야 한다', () => {
    // 슈트 1번 상태를 JAM으로 변경
    const updated = monitoringService.updateChuteStatus(1, 'JAM');
    expect(updated).toBe(true);

    const chuteState = monitoringService.getChuteState(1);
    expect(chuteState).toBeDefined();
    expect(chuteState!.status).toBe('JAM');

    // 전체 슈트 상태 조회
    const allStates = monitoringService.getAllChuteStates();
    expect(allStates).toHaveLength(20);
    const jamChute = allStates.find((c) => c.chuteNumber === 1);
    expect(jamChute!.status).toBe('JAM');

    // 존재하지 않는 슈트 업데이트
    const nonExistent = monitoringService.updateChuteStatus(999, 'ERROR');
    expect(nonExistent).toBe(false);
  });
});
