import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FallbackService } from '../../src/fallback/fallback.service';
import { ConnectionService } from '../../src/connection/connection.service';
import * as fs from 'fs';

/**
 * SIMS 장애 대응(Fallback) 서비스 통합 테스트 (시나리오 3, 5)
 * - SIMS 장애 감지 시 fallback 모드 전환
 * - CSV 파일 생성 (체결정보 → Post-Net 직접 등록용)
 * - 복구 후 대기 레코드 동기화
 * - fallback 상태 및 이벤트 조회
 */
describe('FallbackService 통합 테스트 (시나리오 3, 5)', () => {
  let app: INestApplication;
  let fallbackService: FallbackService;
  let connectionMock: { isSimsConnected: jest.Mock };

  beforeEach(async () => {
    connectionMock = {
      isSimsConnected: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackService,
        {
          provide: ConnectionService,
          useValue: connectionMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    fallbackService = module.get<FallbackService>(FallbackService);
  });

  afterEach(async () => {
    fallbackService.onModuleDestroy();
    await app.close();

    // 테스트에서 생성된 fallback 디렉토리 정리
    try {
      const files = fs.readdirSync('./fallback');
      for (const file of files) {
        if (file.startsWith('fallback_')) {
          fs.unlinkSync(`./fallback/${file}`);
        }
      }
    } catch {
      // 디렉토리가 없으면 무시
    }
  });

  // ======================================================
  // 시나리오 3: SIMS 장애 감지 시 fallback 모드 전환
  // ======================================================
  describe('SIMS 장애 감지 시 fallback 모드 전환', () => {
    it('초기 상태는 INACTIVE여야 한다', () => {
      const status = fallbackService.getStatus();
      expect(status.status).toBe('INACTIVE');
      expect(status.pendingRecords).toBe(0);
      expect(status.csvFilesGenerated).toBe(0);
      expect(status.consecutiveFailures).toBe(0);
    });

    it('SIMS 장애가 FAILURE_THRESHOLD 이상 연속 감지되면 ACTIVATED로 전환해야 한다', () => {
      // SIMS 연결 끊김 시뮬레이션
      connectionMock.isSimsConnected.mockReturnValue(false);

      // checkSimsHealth는 private이므로 내부 헬스체크 인터벌을 시뮬레이션
      // 직접 접근 대신 내부 상태를 변경하기 위해 반복 호출
      // FallbackService.FAILURE_THRESHOLD = 3 이므로 3번 실패 필요
      (fallbackService as any).checkSimsHealth();
      expect(fallbackService.getStatus().status).toBe('INACTIVE');

      (fallbackService as any).checkSimsHealth();
      expect(fallbackService.getStatus().status).toBe('INACTIVE');

      (fallbackService as any).checkSimsHealth();
      // 3번째 실패에서 ACTIVATED로 전환
      expect(fallbackService.getStatus().status).toBe('ACTIVATED');
      expect(fallbackService.getStatus().activatedAt).toBeDefined();
    });

    it('fallback 활성화 시 관련 이벤트가 기록되어야 한다', () => {
      connectionMock.isSimsConnected.mockReturnValue(false);

      // 3번 연속 실패 -> 활성화
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();

      const events = fallbackService.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(2);

      const eventTypes = events.map((e) => e.eventType);
      expect(eventTypes).toContain('SIMS_DOWN_DETECTED');
      expect(eventTypes).toContain('FALLBACK_ACTIVATED');
    });
  });

  // ======================================================
  // 시나리오 3: CSV 파일 생성 (체결정보 -> Post-Net 직접 등록용)
  // ======================================================
  describe('Fallback 모드에서 CSV 파일 생성', () => {
    beforeEach(() => {
      // fallback 모드 활성화
      connectionMock.isSimsConnected.mockReturnValue(false);
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      expect(fallbackService.getStatus().status).toBe('ACTIVATED');
    });

    it('ACTIVATED 상태에서 대기 레코드를 추가할 수 있어야 한다', () => {
      fallbackService.addPendingRecord('SORTING_RESULT', {
        barcode: '1234567890123',
        sortCode: 'A001',
        destinationChute: 'C-05',
        result: 'SUCCESS',
        processedAt: new Date().toISOString(),
        equipmentId: 'EQ-001',
        postOfficeCode: '06000',
      });

      fallbackService.addPendingRecord('BINDING_INFO', {
        barcode: '9876543210987',
        containerNumber: 'CNT-001',
        destinationCode: 'BUSAN',
        bindingType: 'BUNDLE',
        confirmedAt: new Date().toISOString(),
        operatorId: 'OP-001',
        postOfficeCode: '06000',
      });

      const status = fallbackService.getStatus();
      expect(status.pendingRecords).toBe(2);

      const pendingRecords = fallbackService.getPendingRecords();
      expect(pendingRecords.length).toBe(2);
    });

    it('대기 레코드로부터 CSV 파일을 생성해야 한다', () => {
      // 레코드 추가
      fallbackService.addPendingRecord('SORTING_RESULT', {
        barcode: '1234567890123',
        sortCode: 'A001',
        destinationChute: 'C-05',
        result: 'SUCCESS',
        processedAt: new Date().toISOString(),
        equipmentId: 'EQ-001',
        postOfficeCode: '06000',
      });

      const filePath = fallbackService.generateCSVFile('SORTING_RESULT');
      expect(filePath).not.toBeNull();
      expect(filePath).toContain('fallback_SORTING_RESULT_');
      expect(filePath).toContain('.csv');

      // CSV 파일이 실제로 생성되었는지 확인
      expect(fs.existsSync(filePath!)).toBe(true);

      // CSV 파일 목록에 추가되었는지 확인
      const csvFiles = fallbackService.getCSVFiles();
      expect(csvFiles.length).toBe(1);

      // 생성 후 pending 레코드가 비어야 한다
      expect(fallbackService.getStatus().pendingRecords).toBe(0);

      // CSV_FILE_CREATED 이벤트 확인
      const events = fallbackService.getEvents();
      const csvEvent = events.find((e) => e.eventType === 'CSV_FILE_CREATED');
      expect(csvEvent).toBeDefined();
      expect(csvEvent!.recordCount).toBe(1);
    });

    it('INACTIVE 상태에서는 레코드가 추가되지 않아야 한다', async () => {
      // 새로운 서비스를 INACTIVE 상태로 생성
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FallbackService,
          {
            provide: ConnectionService,
            useValue: { isSimsConnected: jest.fn().mockReturnValue(true) },
          },
        ],
      }).compile();

      const inactiveService = module.get<FallbackService>(FallbackService);
      inactiveService.addPendingRecord('SORTING_RESULT', { barcode: '123' });
      expect(inactiveService.getStatus().pendingRecords).toBe(0);
      inactiveService.onModuleDestroy();
    });
  });

  // ======================================================
  // 시나리오 5: 복구 후 대기 레코드 동기화
  // ======================================================
  describe('SIMS 복구 후 대기 레코드 자동 동기화', () => {
    it('SIMS 복구 감지 시 RECOVERING 상태를 거쳐 INACTIVE로 복귀해야 한다', async () => {
      // 1단계: SIMS 장애 -> fallback 활성화
      connectionMock.isSimsConnected.mockReturnValue(false);
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      expect(fallbackService.getStatus().status).toBe('ACTIVATED');

      // 레코드 추가
      fallbackService.addPendingRecord('SORTING_RESULT', {
        barcode: '1111111111111',
        sortCode: 'B002',
      });
      fallbackService.addPendingRecord('BINDING_INFO', {
        barcode: '2222222222222',
        containerNumber: 'CNT-002',
      });
      expect(fallbackService.getStatus().pendingRecords).toBe(2);

      // 2단계: SIMS 복구 -> recovery 프로세스
      connectionMock.isSimsConnected.mockReturnValue(true);

      // RECOVERY_THRESHOLD = 5 이므로 5번 연속 성공 필요
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      // 5번째 성공에서 recovery 시작
      await (fallbackService as any).checkSimsHealth();

      // startRecovery가 async이므로 이벤트 루프 대기
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 복구 완료 후 상태 확인
      const status = fallbackService.getStatus();
      expect(status.status).toBe('INACTIVE');
      expect(status.pendingRecords).toBe(0);
      expect(status.activatedAt).toBeUndefined();
    });

    it('복구 과정에서 관련 이벤트가 기록되어야 한다', async () => {
      // 장애 -> 활성화
      connectionMock.isSimsConnected.mockReturnValue(false);
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();

      // 복구
      connectionMock.isSimsConnected.mockReturnValue(true);
      for (let i = 0; i < 5; i++) {
        await (fallbackService as any).checkSimsHealth();
      }
      await new Promise((resolve) => setTimeout(resolve, 50));

      const events = fallbackService.getEvents();
      const eventTypes = events.map((e) => e.eventType);

      expect(eventTypes).toContain('SIMS_DOWN_DETECTED');
      expect(eventTypes).toContain('FALLBACK_ACTIVATED');
      expect(eventTypes).toContain('SIMS_RECOVERED');
      expect(eventTypes).toContain('RECOVERY_STARTED');
      expect(eventTypes).toContain('RECOVERY_COMPLETED');
    });
  });

  // ======================================================
  // Fallback 상태 및 이벤트 조회
  // ======================================================
  describe('Fallback 상태 및 이벤트 조회', () => {
    it('상태 조회 시 모든 필드가 포함되어야 한다', () => {
      const status = fallbackService.getStatus();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('pendingRecords');
      expect(status).toHaveProperty('csvFilesGenerated');
      expect(status).toHaveProperty('consecutiveFailures');
      expect(status).toHaveProperty('consecutiveSuccesses');
    });

    it('이벤트 이력은 제한된 수량으로 조회되어야 한다', () => {
      // fallback 활성화로 이벤트 생성
      connectionMock.isSimsConnected.mockReturnValue(false);
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();
      (fallbackService as any).checkSimsHealth();

      const limitedEvents = fallbackService.getEvents(1);
      expect(limitedEvents.length).toBe(1);

      const allEvents = fallbackService.getEvents();
      expect(allEvents.length).toBeGreaterThan(1);
    });
  });
});
