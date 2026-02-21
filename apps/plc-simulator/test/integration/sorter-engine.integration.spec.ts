import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SorterEngineService } from '../../src/sorter-engine/sorter-engine.service';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';
import {
  SorterStatus,
  InductionStatus,
  InductionMode,
} from '../../src/sorter-engine/sorter-engine.types';

/**
 * 구분기 엔진 서비스 통합 테스트
 *
 * SorterEngineService의 시작/중지/리셋, 우편물 투입, 슈트 배출, 장애 주입/해제를 검증합니다.
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

describe('SorterEngineService 통합 테스트', () => {
  let service: SorterEngineService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        SorterEngineService,
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

    service = module.get<SorterEngineService>(SorterEngineService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  // 테스트 1: 구분기 시작/중지/리셋
  describe('구분기 시작/중지/리셋', () => {
    it('start() 호출 시 RUNNING 상태로 전환되고 모든 인덕션이 가동되어야 한다', () => {
      const initialState = service.getSorterState();
      expect(initialState.status).toBe(SorterStatus.STOPPED);

      service.start();

      const state = service.getSorterState();
      expect(state.status).toBe(SorterStatus.RUNNING);
      expect(state.startedAt).toBeDefined();

      // 모든 인덕션이 RUNNING 상태여야 한다
      const inductions = service.getInductions();
      for (const ind of inductions) {
        expect(ind.status).toBe(InductionStatus.RUNNING);
      }

      // SorterStatus 전문(Telegram 10)이 RECEIVE_MCS 채널로 전송되어야 한다
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledWith(
        'RECEIVE_MCS',
        expect.any(Buffer),
      );
    });

    it('stop() 호출 시 STOPPED 상태로 전환되고 모든 인덕션이 정지되어야 한다', () => {
      service.start();
      service.stop();

      const state = service.getSorterState();
      expect(state.status).toBe(SorterStatus.STOPPED);

      const inductions = service.getInductions();
      for (const ind of inductions) {
        expect(ind.status).toBe(InductionStatus.STOPPED);
      }
    });

    it('reset() 호출 시 모든 통계와 상태가 초기화되어야 한다', () => {
      service.start();

      // 수동으로 우편물을 투입하여 통계를 발생시킨다
      service.injectItem(1);

      expect(service.getSorterState().totalInducted).toBeGreaterThanOrEqual(1);

      // 리셋 호출
      service.reset();

      const state = service.getSorterState();
      expect(state.status).toBe(SorterStatus.STOPPED);
      expect(state.totalInducted).toBe(0);
      expect(state.totalDischarged).toBe(0);
      expect(state.totalConfirmed).toBe(0);
      expect(state.totalErrors).toBe(0);
      expect(state.totalNoRead).toBe(0);
      expect(state.totalRecirculated).toBe(0);
      expect(state.startedAt).toBeUndefined();

      // 활성 우편물이 없어야 한다
      expect(service.getActiveItems().length).toBe(0);
    });

    it('이미 RUNNING 상태에서 start()를 다시 호출하면 중복 실행되지 않아야 한다', () => {
      service.start();
      const callCount = mockTcpServerService.sendToChannel.mock.calls.length;

      service.start(); // 중복 호출
      // 추가 전문 전송이 발생하지 않아야 한다
      expect(mockTcpServerService.sendToChannel.mock.calls.length).toBe(callCount);
    });
  });

  // 테스트 2: 우편물 투입 시뮬레이션
  describe('우편물 투입 시뮬레이션', () => {
    it('injectItem() 호출 시 우편물이 생성되고 투입 전문이 전송되어야 한다', () => {
      service.start();
      mockTcpServerService.sendToChannel.mockClear();

      const item = service.injectItem(1);

      expect(item).not.toBeNull();
      expect(item!.inductionNo).toBe(1);
      expect(item!.pid).toBeGreaterThan(0);
      expect(item!.cellIndex).toBeGreaterThan(0);
      expect(item!.status).toBe('IN_TRANSIT');
      expect(item!.destination).toBeGreaterThanOrEqual(1);

      // Telegram 20 (ItemInducted)이 RECEIVE_INDUCT 채널로 전송되어야 한다
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledWith(
        'RECEIVE_INDUCT',
        expect.any(Buffer),
      );

      // sorter.item.inducted 이벤트가 발행되어야 한다
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'sorter.item.inducted',
        expect.objectContaining({
          inductionNo: 1,
          status: 'IN_TRANSIT',
        }),
      );

      // 활성 우편물 목록에 포함되어야 한다
      const activeItems = service.getActiveItems();
      expect(activeItems.length).toBeGreaterThanOrEqual(1);

      // 통계가 업데이트 되어야 한다
      expect(service.getSorterState().totalInducted).toBeGreaterThanOrEqual(1);
    });

    it('존재하지 않는 인덕션 번호로 투입하면 null을 반환해야 한다', () => {
      service.start();
      const item = service.injectItem(999);
      expect(item).toBeNull();
    });

    it('연속 투입 시 cellIndex가 순차적으로 증가해야 한다', () => {
      service.start();

      const item1 = service.injectItem(1);
      const item2 = service.injectItem(1);

      expect(item1).not.toBeNull();
      expect(item2).not.toBeNull();
      expect(item2!.cellIndex).toBe(item1!.cellIndex + 1);
    });
  });

  // 테스트 3: 슈트 배출 추적
  describe('슈트 배출 추적', () => {
    it('우편물 투입 후 transitTimeMs 경과 시 배출 처리되어야 한다', async () => {
      // 빠른 테스트를 위해 설정을 변경한다
      service.updateConfig({
        transitTimeMs: 200,
        confirmDelayMs: 100,
        inductionIntervalMs: 100000, // 자동 투입 방지
      });

      service.start();
      mockTcpServerService.sendToChannel.mockClear();

      // 수동 투입
      service.injectItem(1);
      expect(service.getSorterState().totalInducted).toBe(1);

      // transitTimeMs(200ms) + 여유 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 배출 처리 확인
      expect(service.getSorterState().totalDischarged).toBeGreaterThanOrEqual(1);

      // Telegram 21 (ItemDischarged)이 RECEIVE_DISCHARGE 채널로 전송되어야 한다
      const dischargeCalls = mockTcpServerService.sendToChannel.mock.calls.filter(
        (call: any) => call[0] === 'RECEIVE_DISCHARGE',
      );
      expect(dischargeCalls.length).toBeGreaterThanOrEqual(1);

      // confirmDelayMs(100ms) 추가 대기 후 확인 처리
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Telegram 22 (ItemSortedConfirm)이 RECEIVE_CONFIRM 채널로 전송되어야 한다
      const confirmCalls = mockTcpServerService.sendToChannel.mock.calls.filter(
        (call: any) => call[0] === 'RECEIVE_CONFIRM',
      );
      expect(confirmCalls.length).toBeGreaterThanOrEqual(1);

      // 확인 후 활성 우편물 목록에서 제거되어야 한다
      expect(service.getSorterState().totalConfirmed).toBeGreaterThanOrEqual(1);
    });

    it('getChutes()로 슈트별 통계를 조회할 수 있어야 한다', () => {
      const chutes = service.getChutes();
      const config = service.getConfig();

      expect(chutes.length).toBe(config.chuteCount);
      for (const chute of chutes) {
        expect(chute).toHaveProperty('no');
        expect(chute).toHaveProperty('itemCount');
        expect(chute).toHaveProperty('overflow');
        expect(chute.no).toBeGreaterThanOrEqual(1);
        expect(chute.itemCount).toBe(0);
        expect(chute.overflow).toBe(false);
      }
    });
  });

  // 테스트 4: 장애 주입/해제
  describe('장애 주입/해제', () => {
    beforeEach(() => {
      service.start();
    });

    it('MOTOR_TRIP 주입 시 EMERGENCY 상태, 해제 시 STOPPED 상태로 전환되어야 한다', () => {
      service.triggerFault('MOTOR_TRIP');
      expect(service.getSorterState().status).toBe(SorterStatus.EMERGENCY);

      service.clearFault('MOTOR_TRIP');
      expect(service.getSorterState().status).toBe(SorterStatus.STOPPED);
    });

    it('JAM 주입 시 해당 인덕션만 FAULT, 해제 시 STOPPED로 전환되어야 한다', () => {
      service.triggerFault('JAM', 1);

      const inductions = service.getInductions();
      expect(inductions[0].status).toBe(InductionStatus.FAULT);
      expect(inductions[1].status).toBe(InductionStatus.RUNNING);

      service.clearFault('JAM');
      expect(service.getInductions()[0].status).toBe(InductionStatus.STOPPED);
    });

    it('OVERFLOW 주입 시 슈트 만재, 해제 시 overflow 플래그가 해제되어야 한다', () => {
      service.triggerFault('OVERFLOW', 3);

      const chutes = service.getChutes();
      const chute3 = chutes.find((c) => c.no === 3);
      expect(chute3!.overflow).toBe(true);
      expect(chute3!.itemCount).toBeGreaterThanOrEqual(service.getConfig().overflowThreshold);

      service.clearFault('OVERFLOW');
      expect(service.getChutes().find((c) => c.no === 3)!.overflow).toBe(false);
    });

    it('장애 주입 시 totalErrors가 증가해야 한다', () => {
      const before = service.getSorterState().totalErrors;
      service.triggerFault('MOTOR_TRIP');
      expect(service.getSorterState().totalErrors).toBe(before + 1);
    });
  });
});
