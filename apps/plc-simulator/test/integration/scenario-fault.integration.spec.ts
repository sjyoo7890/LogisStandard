import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScenarioService } from '../../src/scenario/scenario.service';
import { SorterEngineService } from '../../src/sorter-engine/sorter-engine.service';
import { HeartbeatService } from '../../src/heartbeat/heartbeat.service';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';
import {
  SorterStatus,
  InductionStatus,
} from '../../src/sorter-engine/sorter-engine.types';

/**
 * 장애 시나리오(FAULT) 통합 테스트
 *
 * ScenarioService + SorterEngineService를 이용한 장애 주입/해제 흐름을 검증합니다.
 * MOTOR_TRIP, JAM, OVERFLOW 세 가지 장애 유형의 동작을 테스트합니다.
 *
 * 의존성: TcpServerService (mock), EventEmitter2 (mock)
 */

// TcpServerService 모킹
const mockTcpServerService = {
  startAllServers: jest.fn(),
  stopAllServers: jest.fn(),
  handleConnection: jest.fn(),
  handleData: jest.fn(),
  sendToChannel: jest.fn().mockReturnValue(true),
  sendToSocket: jest.fn().mockReturnValue(true),
  getTelegramLog: jest.fn().mockReturnValue([]),
  getChannelStatus: jest.fn().mockReturnValue([]),
  hasClients: jest.fn().mockReturnValue(false),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
};

// EventEmitter2 모킹
const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

describe('장애 시나리오(FAULT) 통합 테스트', () => {
  let scenarioService: ScenarioService;
  let sorterEngine: SorterEngineService;
  let heartbeatService: HeartbeatService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        ScenarioService,
        SorterEngineService,
        HeartbeatService,
        {
          provide: TcpServerService,
          useValue: mockTcpServerService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    scenarioService = module.get<ScenarioService>(ScenarioService);
    sorterEngine = module.get<SorterEngineService>(SorterEngineService);
    heartbeatService = module.get<HeartbeatService>(HeartbeatService);
  });

  afterEach(() => {
    scenarioService.stopScenario();
    sorterEngine.onModuleDestroy();
  });

  // 테스트 1: 장애 시나리오 시작
  describe('장애 시나리오 시작', () => {
    it('fault 시나리오가 목록에 존재하고 올바른 단계 구성을 가져야 한다', () => {
      const scenarios = scenarioService.getScenarios();
      const faultScenario = scenarios.find((s) => s.id === 'fault');

      expect(faultScenario).toBeDefined();
      expect(faultScenario!.name).toBe('장애 시나리오');
      expect(faultScenario!.steps.length).toBe(10);

      // 장애 시나리오 단계 검증: START → WAIT → JAM → WAIT → CLEAR JAM → WAIT → MOTOR_TRIP → WAIT → CLEAR → STOP
      expect(faultScenario!.steps[0].action).toBe('START_SORTER');
      expect(faultScenario!.steps[2].action).toBe('TRIGGER_FAULT');
      expect(faultScenario!.steps[2].params?.type).toBe('JAM');
      expect(faultScenario!.steps[4].action).toBe('CLEAR_FAULT');
      expect(faultScenario!.steps[6].action).toBe('TRIGGER_FAULT');
      expect(faultScenario!.steps[6].params?.type).toBe('MOTOR_TRIP');
      expect(faultScenario!.steps[8].action).toBe('CLEAR_FAULT');
      expect(faultScenario!.steps[9].action).toBe('STOP_SORTER');
    });

    it('fault 시나리오를 시작하면 구분기가 가동되어야 한다', async () => {
      await scenarioService.startScenario('fault');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = scenarioService.getStatus();
      expect(status).not.toBeNull();
      expect(status!.id).toBe('fault');
      expect(status!.running).toBe(true);

      // 첫 단계(START_SORTER) 실행 후 구분기가 가동 상태여야 한다
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.RUNNING);

      scenarioService.stopScenario();
    });
  });

  // 테스트 2: MOTOR_TRIP / JAM / OVERFLOW 장애 주입
  describe('MOTOR_TRIP / JAM / OVERFLOW 장애 주입', () => {
    beforeEach(() => {
      // 구분기를 먼저 가동한다
      sorterEngine.start();
    });

    it('MOTOR_TRIP 장애 주입 시 구분기가 EMERGENCY 상태로 전환되어야 한다', () => {
      sorterEngine.triggerFault('MOTOR_TRIP');

      const state = sorterEngine.getSorterState();
      expect(state.status).toBe(SorterStatus.EMERGENCY);
      expect(state.totalErrors).toBeGreaterThanOrEqual(1);

      // MOTOR_TRIP 상태 전문이 전송되어야 한다
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledWith(
        'RECEIVE_MCS',
        expect.any(Buffer),
      );
    });

    it('JAM 장애 주입 시 해당 인덕션이 FAULT 상태로 전환되어야 한다', () => {
      sorterEngine.triggerFault('JAM', 1);

      const inductions = sorterEngine.getInductions();
      const ind1 = inductions.find((i) => i.no === 1);
      expect(ind1).toBeDefined();
      expect(ind1!.status).toBe(InductionStatus.FAULT);

      // 나머지 인덕션은 영향 받지 않아야 한다
      const ind2 = inductions.find((i) => i.no === 2);
      expect(ind2).toBeDefined();
      expect(ind2!.status).toBe(InductionStatus.RUNNING);
    });

    it('OVERFLOW 장애 주입 시 해당 슈트가 만재 상태가 되어야 한다', () => {
      sorterEngine.triggerFault('OVERFLOW', 1);

      const chutes = sorterEngine.getChutes();
      const chute1 = chutes.find((c) => c.no === 1);
      expect(chute1).toBeDefined();
      expect(chute1!.overflow).toBe(true);
      expect(chute1!.itemCount).toBeGreaterThanOrEqual(1);
    });
  });

  // 테스트 3: 장애 해제
  describe('장애 해제', () => {
    beforeEach(() => {
      sorterEngine.start();
    });

    it('MOTOR_TRIP 장애 해제 시 EMERGENCY에서 STOPPED로 전환되어야 한다', () => {
      sorterEngine.triggerFault('MOTOR_TRIP');
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.EMERGENCY);

      sorterEngine.clearFault('MOTOR_TRIP');
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.STOPPED);
    });

    it('JAM 장애 해제 시 FAULT 상태의 인덕션이 STOPPED로 전환되어야 한다', () => {
      sorterEngine.triggerFault('JAM', 1);
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.FAULT);

      sorterEngine.clearFault('JAM');
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.STOPPED);
    });

    it('OVERFLOW 장애 해제 시 슈트의 overflow 플래그가 false로 변경되어야 한다', () => {
      sorterEngine.triggerFault('OVERFLOW', 1);
      expect(sorterEngine.getChutes()[0].overflow).toBe(true);

      sorterEngine.clearFault('OVERFLOW');
      expect(sorterEngine.getChutes()[0].overflow).toBe(false);
    });

    it('전체 장애 해제 (clearFault 인자 없이) 시 모든 장애가 복구되어야 한다', () => {
      // 복합 장애 주입
      sorterEngine.triggerFault('MOTOR_TRIP');
      sorterEngine.triggerFault('JAM', 1);
      sorterEngine.triggerFault('OVERFLOW', 2);

      // 전체 해제
      sorterEngine.clearFault();

      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.STOPPED);
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.STOPPED);
      expect(sorterEngine.getChutes()[1].overflow).toBe(false);
    });
  });

  // 테스트 4: 장애 복구 후 정상 운영
  describe('장애 복구 후 정상 운영', () => {
    it('MOTOR_TRIP 복구 후 구분기를 다시 시작하면 RUNNING 상태로 전환되어야 한다', () => {
      sorterEngine.start();
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.RUNNING);

      // MOTOR_TRIP 장애 발생
      sorterEngine.triggerFault('MOTOR_TRIP');
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.EMERGENCY);

      // 장애 해제
      sorterEngine.clearFault('MOTOR_TRIP');
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.STOPPED);

      // 구분기 재시작
      sorterEngine.start();
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.RUNNING);

      // 모든 인덕션이 가동 상태여야 한다
      const inductions = sorterEngine.getInductions();
      for (const ind of inductions) {
        expect(ind.status).toBe(InductionStatus.RUNNING);
      }
    });

    it('JAM 복구 후 해당 인덕션을 다시 가동하면 RUNNING 상태로 전환되어야 한다', () => {
      sorterEngine.start();

      // 1번 인덕션 JAM 발생
      sorterEngine.triggerFault('JAM', 1);
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.FAULT);

      // JAM 해제
      sorterEngine.clearFault('JAM');
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.STOPPED);

      // 1번 인덕션 가동 (제어 명령)
      const result = sorterEngine.setInductionControl(1, 1);
      expect(result.reason).toBe(0); // 성공
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.RUNNING);
    });
  });
});
