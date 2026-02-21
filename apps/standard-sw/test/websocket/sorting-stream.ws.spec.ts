import { Test, TestingModule } from '@nestjs/testing';
import { SortingService, SortEvent, CommLogEntry } from '../../src/sorting/sorting.service';
import { SortingStreamGateway } from '../../src/gateway/sorting-stream.gateway';

/**
 * WebSocket 구분 스트림 통합 테스트
 * - 구분 이벤트 스트림, 통신 로그 스트림
 */
describe('WebSocket 구분 스트림 테스트 (/ws/sorting-stream)', () => {
  let sortingService: SortingService;
  let gateway: SortingStreamGateway;
  let module: TestingModule;
  let mockServer: { emit: jest.Mock };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [SortingService, SortingStreamGateway],
    }).compile();

    sortingService = module.get<SortingService>(SortingService);
    gateway = module.get<SortingStreamGateway>(SortingStreamGateway);

    sortingService.onModuleInit();

    // 모의 WebSocket 서버 설정
    mockServer = { emit: jest.fn() };
    (gateway as any).server = mockServer;

    // afterInit 호출하여 이벤트 리스너 등록
    gateway.afterInit();
  });

  afterEach(() => {
    // broadcastInterval 정리
    if ((gateway as any).broadcastInterval) {
      clearInterval((gateway as any).broadcastInterval);
    }
    sortingService.onModuleDestroy();
  });

  // -------------------------------------------------------
  // 1. 구분 이벤트 스트림 (sort-event)
  // -------------------------------------------------------
  it('바코드 처리 시 sort-event가 WebSocket으로 브로드캐스트되어야 한다', () => {
    // 바코드 처리 → 이벤트 발생
    const event = sortingService.processBarcode('4201234567890');

    // sort-event 이벤트 전송 확인
    expect(mockServer.emit).toHaveBeenCalledWith('sort-event', expect.objectContaining({
      barcode: '4201234567890',
      result: 'SUCCESS',
      destination: '서울강북',
      assignedChute: 1,
    }));
  });

  // -------------------------------------------------------
  // 2. 다수 구분 이벤트 순차 처리
  // -------------------------------------------------------
  it('다수 바코드 처리 시 각각의 sort-event가 순차적으로 전송되어야 한다', () => {
    sortingService.processBarcode('4201000000000'); // SUCCESS - 서울강북
    sortingService.processBarcode('4202000000000'); // SUCCESS - 서울강남
    sortingService.processBarcode('INVALID');        // REJECT

    // sort-event 호출 3회 + comm-log 호출 3회
    const sortEventCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'sort-event',
    );
    expect(sortEventCalls).toHaveLength(3);

    // 첫 번째 이벤트: 서울강북
    expect(sortEventCalls[0][1].destination).toBe('서울강북');
    expect(sortEventCalls[0][1].result).toBe('SUCCESS');

    // 두 번째 이벤트: 서울강남
    expect(sortEventCalls[1][1].destination).toBe('서울강남');

    // 세 번째 이벤트: REJECT
    expect(sortEventCalls[2][1].result).toBe('REJECT');
    expect(sortEventCalls[2][1].destination).toBe('미구분');
  });

  // -------------------------------------------------------
  // 3. 통신 로그 스트림 (comm-log)
  // -------------------------------------------------------
  it('바코드 처리 시 comm-log가 WebSocket으로 브로드캐스트되어야 한다', () => {
    sortingService.processBarcode('4201234567890');

    // comm-log 이벤트 전송 확인
    const commLogCalls = mockServer.emit.mock.calls.filter(
      (call: any[]) => call[0] === 'comm-log',
    );
    expect(commLogCalls).toHaveLength(1);
    expect(commLogCalls[0][1]).toMatchObject({
      direction: 'SEND',
      messageType: 'SORT_COMMAND',
      success: true,
    });
    expect(commLogCalls[0][1].target).toContain('PLC-CHUTE-');
  });

  // -------------------------------------------------------
  // 4. 주기적 통계 브로드캐스트 (sort-status)
  // -------------------------------------------------------
  it('주기적으로 sort-status가 브로드캐스트되어야 한다', (done) => {
    // 바코드 처리하여 통계 생성
    sortingService.processBarcode('4201000000000');
    sortingService.processBarcode('INVALID');

    // broadcastInterval (2초) 대기 후 확인
    setTimeout(() => {
      const statusCalls = mockServer.emit.mock.calls.filter(
        (call: any[]) => call[0] === 'sort-status',
      );
      expect(statusCalls.length).toBeGreaterThanOrEqual(1);

      const lastStatus = statusCalls[statusCalls.length - 1][1];
      expect(lastStatus).toHaveProperty('totalProcessed');
      expect(lastStatus).toHaveProperty('successCount');
      expect(lastStatus).toHaveProperty('rejectCount');
      expect(lastStatus).toHaveProperty('successRate');
      expect(lastStatus.totalProcessed).toBe(2);
      done();
    }, 2500);
  });
});
