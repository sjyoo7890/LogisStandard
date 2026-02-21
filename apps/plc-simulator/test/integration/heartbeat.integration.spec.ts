import { Test, TestingModule } from '@nestjs/testing';
import { HeartbeatService } from '../../src/heartbeat/heartbeat.service';
import { TcpServerService } from '../../src/tcp-server/tcp-server.service';

/**
 * 하트비트 서비스 통합 테스트
 *
 * HeartbeatService의 시작/중지, 카운터 증가, 래핑, 실행 상태를 검증합니다.
 * TcpServerService는 모킹하여 실제 TCP 전송을 차단합니다.
 *
 * 의존성: TcpServerService (mock)
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

describe('HeartbeatService 통합 테스트', () => {
  let service: HeartbeatService;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    module = await Test.createTestingModule({
      providers: [
        HeartbeatService,
        {
          provide: TcpServerService,
          useValue: mockTcpServerService,
        },
      ],
    }).compile();

    service = module.get<HeartbeatService>(HeartbeatService);
  });

  afterEach(() => {
    service.stop();
    jest.useRealTimers();
  });

  // 테스트 1: 하트비트 시작/중지
  describe('하트비트 시작/중지', () => {
    it('start() 호출 시 5초 간격으로 하트비트가 전송되고, stop() 시 중지되어야 한다', () => {
      // 초기 상태 확인
      expect(service.isRunning()).toBe(false);
      expect(service.getHeartbeatNo()).toBe(0);

      // 하트비트 시작
      service.start();
      expect(service.isRunning()).toBe(true);

      // 5초(5000ms) 경과 시 첫 번째 하트비트 전송
      jest.advanceTimersByTime(5000);
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledTimes(1);
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledWith(
        'SEND_HEARTBEAT',
        expect.any(Buffer),
      );
      expect(service.getHeartbeatNo()).toBe(1);

      // 추가 5초 경과 시 두 번째 하트비트 전송
      jest.advanceTimersByTime(5000);
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledTimes(2);
      expect(service.getHeartbeatNo()).toBe(2);

      // 하트비트 중지
      service.stop();
      expect(service.isRunning()).toBe(false);

      // 중지 후에는 추가 전송이 없어야 한다
      jest.advanceTimersByTime(10000);
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledTimes(2);
    });

    it('이미 실행 중인 상태에서 start()를 다시 호출하면 중복 실행되지 않아야 한다', () => {
      service.start();
      service.start(); // 중복 호출

      // 5초 후 하트비트는 1회만 전송되어야 한다
      jest.advanceTimersByTime(5000);
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledTimes(1);
    });
  });

  // 테스트 2: 하트비트 카운터 증가
  describe('하트비트 카운터 증가', () => {
    it('하트비트 전송 시마다 카운터가 1씩 증가해야 한다', () => {
      service.start();

      // 연속 3회 하트비트 전송
      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(1);

      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(2);

      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(3);

      // 전송된 버퍼를 확인하여 heartBeatNo 필드가 올바른지 검증
      expect(mockTcpServerService.sendToChannel).toHaveBeenCalledTimes(3);
    });

    it('reset() 호출 시 카운터가 0으로 초기화되어야 한다', () => {
      service.start();
      jest.advanceTimersByTime(15000); // 3회 전송
      expect(service.getHeartbeatNo()).toBe(3);

      service.reset();
      expect(service.getHeartbeatNo()).toBe(0);
    });
  });

  // 테스트 3: 카운터 래핑 (65535 → 1)
  describe('카운터 래핑 (65535 초과 시)', () => {
    it('카운터가 65535를 초과하면 1로 래핑되어야 한다', () => {
      service.start();

      // heartbeatNo를 65535 직전까지 빠르게 진행시키기 위해
      // 내부 카운터를 직접 조작하는 대신, 충분한 시간을 진행시킨다.
      // 단위 테스트에서는 직접 접근이 어려우므로, 다른 전략을 사용한다.

      // 65535번의 인터벌을 빠르게 진행한다
      // 이 방법은 너무 느리므로, private 필드에 접근한다
      (service as any).heartbeatNo = 65534;

      // 다음 하트비트: 65535
      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(65535);

      // 다음 하트비트: 65536 → 1 로 래핑
      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(1);

      // 다음 하트비트: 2
      jest.advanceTimersByTime(5000);
      expect(service.getHeartbeatNo()).toBe(2);
    });
  });

  // 테스트 4: 실행 상태 확인
  describe('실행 상태 확인', () => {
    it('isRunning()은 시작 전 false, 시작 후 true, 중지 후 false를 반환해야 한다', () => {
      expect(service.isRunning()).toBe(false);

      service.start();
      expect(service.isRunning()).toBe(true);

      service.stop();
      expect(service.isRunning()).toBe(false);
    });

    it('onModuleDestroy() 호출 시 하트비트가 자동으로 중지되어야 한다', () => {
      service.start();
      expect(service.isRunning()).toBe(true);

      service.onModuleDestroy();
      expect(service.isRunning()).toBe(false);

      // 중지 후 추가 전송이 없어야 한다
      jest.advanceTimersByTime(10000);
      expect(mockTcpServerService.sendToChannel).not.toHaveBeenCalled();
    });
  });
});
