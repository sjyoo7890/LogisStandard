import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as net from 'net';
import { CommandHandlerService } from '../../src/command-handler/command-handler.service';
import { SorterEngineService } from '../../src/sorter-engine/sorter-engine.service';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';
import {
  TelegramBuilder,
  SMCToPLCTelegram,
  TELEGRAM_100_DEF,
  TELEGRAM_110_DEF,
  TELEGRAM_120_DEF,
  TELEGRAM_130_DEF,
  TELEGRAM_140_DEF,
} from '@kpost/telegram';
import {
  SorterStatus,
  InductionStatus,
  InductionMode,
} from '../../src/sorter-engine/sorter-engine.types';

/**
 * 명령 처리 서비스 통합 테스트
 *
 * CommandHandlerService가 수신된 SMC→PLC 전문을 올바르게 처리하고
 * SorterEngineService에 명령을 전달한 후 ACK 전문을 생성하는지 검증합니다.
 *
 * 의존성: TcpServerService (mock), EventEmitter2 (mock)
 */

// 모킹 소켓 생성 (sendToSocket 호출 검증용)
const createMockSocket = (): net.Socket => {
  const socket = new net.Socket();
  // 실제 연결 없이 destroyed 를 false 로 설정
  Object.defineProperty(socket, 'destroyed', { value: false, writable: true });
  socket.write = jest.fn().mockReturnValue(true);
  return socket;
};

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

describe('CommandHandlerService 통합 테스트', () => {
  let commandHandler: CommandHandlerService;
  let sorterEngine: SorterEngineService;
  let module: TestingModule;
  let mockSocket: net.Socket;

  beforeEach(async () => {
    jest.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [
        CommandHandlerService,
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

    commandHandler = module.get<CommandHandlerService>(CommandHandlerService);
    sorterEngine = module.get<SorterEngineService>(SorterEngineService);
    mockSocket = createMockSocket();
  });

  afterEach(() => {
    sorterEngine.onModuleDestroy();
    mockSocket.destroy();
  });

  /**
   * 전문 수신 이벤트 페이로드를 생성하는 헬퍼 함수
   */
  function createTelegramPayload(telegramNo: number, data: Record<string, number>) {
    return {
      channel: 'SEND_MCS',
      telegram: {
        header: {
          stx: 0x02,
          dataType: 'D',
          moduleId: 'PSM00',
          telegramNo,
          dataLength: 0,
        },
        data,
        etx: 0x03,
      },
      socket: mockSocket,
    };
  }

  // 테스트 1: 구분기 제어 명령 처리 (Telegram 100 → ACK 101)
  describe('구분기 제어 명령 처리 (SetControlSorter)', () => {
    it('구분기 가동 명령(request=1) 수신 시 구분기를 시작하고 ACK를 전송해야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_CONTROL_SORTER,
        { request: 1 },
      );

      commandHandler.handleTelegram(payload);

      // 구분기가 가동 상태여야 한다
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.RUNNING);

      // ACK(Telegram 101)가 소켓으로 전송되어야 한다
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledWith(
        mockSocket,
        expect.any(Buffer),
      );
    });

    it('구분기 정지 명령(request=0) 수신 시 구분기를 정지하고 ACK를 전송해야 한다', () => {
      // 먼저 구분기를 시작한다
      sorterEngine.start();

      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_CONTROL_SORTER,
        { request: 0 },
      );

      commandHandler.handleTelegram(payload);

      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.STOPPED);
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
    });
  });

  // 테스트 2: 인덕션 제어/모드 설정 (Telegram 110, 120)
  describe('인덕션 제어/모드 설정', () => {
    it('인덕션 가동 명령(Telegram 110) 수신 시 해당 인덕션을 시작하고 ACK(111)를 전송해야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_CONTROL_INDUCTION,
        { inductionNo: 1, request: 1 },
      );

      commandHandler.handleTelegram(payload);

      const inductions = sorterEngine.getInductions();
      expect(inductions[0].status).toBe(InductionStatus.RUNNING);

      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledWith(
        mockSocket,
        expect.any(Buffer),
      );
    });

    it('인덕션 정지 명령(request=0) 수신 시 해당 인덕션을 정지하고 ACK를 전송해야 한다', () => {
      // 인덕션을 먼저 가동한다
      sorterEngine.setInductionControl(1, 1);

      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_CONTROL_INDUCTION,
        { inductionNo: 1, request: 0 },
      );

      commandHandler.handleTelegram(payload);

      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.STOPPED);
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
    });

    it('인덕션 모드 변경 명령(Telegram 120, request=1) 수신 시 타건 모드로 전환하고 ACK(121)를 전송해야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_INDUCTION_MODE,
        { inductionNo: 1, request: 1 },
      );

      commandHandler.handleTelegram(payload);

      const inductions = sorterEngine.getInductions();
      expect(inductions[0].mode).toBe(InductionMode.MANUAL_KEY);

      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
    });
  });

  // 테스트 3: 목적지 요청 응답 (Telegram 30) 및 타건 결과(Telegram 41)
  describe('목적지 요청 및 코드 결과 처리', () => {
    it('DestinationRequest(Telegram 30) 수신 시 에러 없이 처리되어야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.DESTINATION_REQUEST,
        {
          inductionNo: 1,
          pid: 100001,
          destination1: 5,
          destination2: 0,
          destination3: 0,
          destination4: 0,
          destination5: 0,
          destination6: 0,
          destination7: 0,
          destination8: 0,
        },
      );

      // 에러 없이 처리되어야 한다
      expect(() => commandHandler.handleTelegram(payload)).not.toThrow();
    });

    it('CodeResult(Telegram 41) 수신 시 에러 없이 처리되어야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.CODE_RESULT,
        {
          telegramNo: 40,
          cellIndexNo: 1,
          destination1: 10,
          destination2: 0,
          destination3: 0,
          destination4: 0,
          destination5: 0,
          destination6: 0,
          destination7: 0,
          destination8: 0,
        },
      );

      expect(() => commandHandler.handleTelegram(payload)).not.toThrow();
    });
  });

  // 테스트 4: ACK 전문 생성
  describe('ACK 전문 생성', () => {
    it('SetOverflowConfig(Telegram 130) 수신 시 ACK(131)가 전송되어야 한다', () => {
      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_OVERFLOW_CONFIGURATION,
        {
          overflowChute1: 90,
          overflowChute2: 91,
          maxRecirculation: 3,
          reason: 0,
        },
      );

      commandHandler.handleTelegram(payload);

      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledWith(
        mockSocket,
        expect.any(Buffer),
      );
    });

    it('SetResetRequest(Telegram 140) 수신 시 ACK(141)가 전송되고 장애가 해제되어야 한다', () => {
      // 먼저 장애를 발생시킨다
      sorterEngine.start();
      sorterEngine.triggerFault('MOTOR_TRIP');
      sorterEngine.triggerFault('JAM', 1);
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.EMERGENCY);

      const payload = createTelegramPayload(
        SMCToPLCTelegram.SET_RESET_REQUEST,
        { resetModule: 0 },
      );

      commandHandler.handleTelegram(payload);

      // 장애가 해제되어야 한다
      expect(sorterEngine.getSorterState().status).toBe(SorterStatus.STOPPED);
      expect(sorterEngine.getInductions()[0].status).toBe(InductionStatus.STOPPED);

      // ACK(141)가 전송되어야 한다
      expect(mockTcpServerService.sendToSocket).toHaveBeenCalledTimes(1);
    });

    it('알 수 없는 전문 번호 수신 시 에러 없이 무시해야 한다', () => {
      const payload = createTelegramPayload(999, { unknown: 1 });

      expect(() => commandHandler.handleTelegram(payload)).not.toThrow();

      // ACK가 전송되지 않아야 한다
      expect(mockTcpServerService.sendToSocket).not.toHaveBeenCalled();
    });
  });
});
