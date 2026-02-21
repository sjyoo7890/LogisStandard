import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScenarioService } from '../../src/scenario/scenario.service';
import { SorterEngineService } from '../../src/sorter-engine/sorter-engine.service';
import { HeartbeatService } from '../../src/heartbeat/heartbeat.service';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';

/**
 * 정상 시나리오(NORMAL) 통합 테스트
 *
 * ScenarioService + SorterEngineService + HeartbeatService 간의
 * 통합 동작을 검증합니다.
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

describe('정상 시나리오(NORMAL) 통합 테스트', () => {
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

  // 테스트 1: 정상 시나리오 시작
  describe('정상 시나리오 시작', () => {
    it('normal 시나리오를 시작하면 구분기와 하트비트가 가동되어야 한다', async () => {
      // 시나리오 목록에 normal이 포함되어야 한다
      const scenarios = scenarioService.getScenarios();
      const normalScenario = scenarios.find((s) => s.id === 'normal');
      expect(normalScenario).toBeDefined();
      expect(normalScenario!.name).toBe('정상 운영 시나리오');

      // 시나리오 시작
      await scenarioService.startScenario('normal');

      // 시나리오 상태를 확인한다
      const status = scenarioService.getStatus();
      expect(status).not.toBeNull();
      expect(status!.id).toBe('normal');
      expect(status!.running).toBe(true);

      // 약간의 대기 후 구분기가 가동 상태인지 확인
      await new Promise((resolve) => setTimeout(resolve, 100));

      const sorterState = sorterEngine.getSorterState();
      // 첫 번째 스텝(START_SORTER)이 실행되었으므로 RUNNING 상태여야 한다
      expect(sorterState.status).toBe(1); // SorterStatus.RUNNING

      // 하트비트도 실행 중이어야 한다
      expect(heartbeatService.isRunning()).toBe(true);

      scenarioService.stopScenario();
    });
  });

  // 테스트 2: 시나리오 단계 실행
  describe('시나리오 단계 실행', () => {
    it('정상 시나리오의 모든 단계(START→WAIT→STOP)가 순서대로 실행되어야 한다', async () => {
      const scenarios = scenarioService.getScenarios();
      const normalScenario = scenarios.find((s) => s.id === 'normal');
      expect(normalScenario).toBeDefined();
      expect(normalScenario!.steps.length).toBe(3);

      // 단계 구성 검증
      expect(normalScenario!.steps[0].action).toBe('START_SORTER');
      expect(normalScenario!.steps[1].action).toBe('WAIT');
      expect(normalScenario!.steps[1].delayMs).toBe(30000);
      expect(normalScenario!.steps[2].action).toBe('STOP_SORTER');

      // 시나리오 시작
      await scenarioService.startScenario('normal');

      // 첫 번째 단계 실행 후 currentStep 확인
      await new Promise((resolve) => setTimeout(resolve, 100));
      const status = scenarioService.getStatus();
      expect(status).not.toBeNull();
      // 첫 번째 단계 (START_SORTER)는 delayMs가 0이므로 빠르게 2단계(WAIT)로 진행
      expect(status!.currentStep).toBeGreaterThanOrEqual(1);

      // 구분기가 가동 중이어야 한다
      expect(sorterEngine.getSorterState().status).toBe(1); // RUNNING

      // sendToChannel이 호출되었어야 한다 (SorterStatus, InductionStatus 전문)
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalled();

      scenarioService.stopScenario();
    });
  });

  // 테스트 3: 시나리오 상태 조회
  describe('시나리오 상태 조회', () => {
    it('시나리오 미실행 시 null, 실행 중이면 상태 객체를 반환해야 한다', async () => {
      // 시나리오 미실행 시
      expect(scenarioService.getStatus()).toBeNull();

      // 시나리오 시작
      await scenarioService.startScenario('normal');

      // 실행 중 상태 조회
      const status = scenarioService.getStatus();
      expect(status).not.toBeNull();
      expect(status!.id).toBe('normal');
      expect(status!.name).toBe('정상 운영 시나리오');
      expect(status!.running).toBe(true);
      expect(status!.totalSteps).toBe(3);
      expect(status!.startedAt).toBeDefined();
      expect(status!.completedAt).toBeUndefined();

      scenarioService.stopScenario();

      // 중지 후 상태 조회
      const stoppedStatus = scenarioService.getStatus();
      expect(stoppedStatus).not.toBeNull();
      expect(stoppedStatus!.running).toBe(false);
      expect(stoppedStatus!.completedAt).toBeDefined();
    });
  });

  // 테스트 4: 시나리오 중지
  describe('시나리오 중지', () => {
    it('실행 중인 시나리오를 중지하면 구분기도 함께 정지되어야 한다', async () => {
      await scenarioService.startScenario('normal');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 시나리오 실행 확인
      expect(scenarioService.getStatus()!.running).toBe(true);
      expect(sorterEngine.getSorterState().status).toBe(1); // RUNNING

      // 시나리오 중지
      scenarioService.stopScenario();

      // 시나리오가 중지되어야 한다
      expect(scenarioService.getStatus()!.running).toBe(false);

      // 구분기도 정지 상태여야 한다
      expect(sorterEngine.getSorterState().status).toBe(0); // STOPPED
    });

    it('이미 실행 중인 시나리오가 있을 때 중복 시작하면 에러가 발생해야 한다', async () => {
      await scenarioService.startScenario('normal');

      await expect(scenarioService.startScenario('fault')).rejects.toThrow(
        'A scenario is already running',
      );

      scenarioService.stopScenario();
    });
  });
});
