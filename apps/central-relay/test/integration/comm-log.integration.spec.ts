import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CommLogService } from '../../src/comm-log/comm-log.service';

/**
 * 통신 로그 서비스 통합 테스트
 * - 통신 로그 기록 (송수신 데이터 로깅)
 * - 필터 기반 로그 조회 (방향, 레벨, 프로토콜, 키워드)
 * - 로그 통계 조회
 * - 보존 기간 초과 로그 정리 (60일)
 */
describe('CommLogService 통신 로그 통합 테스트', () => {
  let app: INestApplication;
  let commLogService: CommLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommLogService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    commLogService = module.get<CommLogService>(CommLogService);
  });

  afterEach(async () => {
    await app.close();
  });

  // ======================================================
  // 시나리오 1: 통신 로그 기록
  // ======================================================
  describe('통신 로그 기록', () => {
    it('Inbound 통신 로그를 기록해야 한다', () => {
      const entry = commLogService.log({
        direction: 'INBOUND',
        sourceId: 'SIMS',
        targetId: 'RELAY',
        protocol: 'DB2DB',
        messageType: 'RECEPTION_INFO_SYNC',
        dataSize: 2048,
        level: 'INFO',
        message: 'SIMS에서 접수정보 100건 수신',
        duration: 150,
      });

      expect(entry).toBeDefined();
      expect(entry.id).toMatch(/^LOG_/);
      expect(entry.direction).toBe('INBOUND');
      expect(entry.sourceId).toBe('SIMS');
      expect(entry.targetId).toBe('RELAY');
      expect(entry.protocol).toBe('DB2DB');
      expect(entry.messageType).toBe('RECEPTION_INFO_SYNC');
      expect(entry.dataSize).toBe(2048);
      expect(entry.level).toBe('INFO');
      expect(entry.duration).toBe(150);
      expect(entry.timestamp).toBeDefined();
    });

    it('Outbound 통신 로그를 기록해야 한다', () => {
      const entry = commLogService.log({
        direction: 'OUTBOUND',
        sourceId: 'RELAY',
        targetId: 'SEOUL',
        protocol: 'TCP_SOCKET',
        messageType: 'SORTING_RESULT_PUSH',
        dataSize: 4096,
        level: 'INFO',
        message: '서울집중국으로 구분결과 50건 전송',
        duration: 200,
      });

      expect(entry.direction).toBe('OUTBOUND');
      expect(entry.sourceId).toBe('RELAY');
      expect(entry.targetId).toBe('SEOUL');
    });

    it('ERROR 레벨 로그를 기록해야 한다', () => {
      const entry = commLogService.log({
        direction: 'OUTBOUND',
        sourceId: 'RELAY',
        targetId: 'SIMS',
        protocol: 'DB2DB',
        messageType: 'SYNC_ERROR',
        dataSize: 0,
        level: 'ERROR',
        message: 'SIMS 연결 실패 - 타임아웃',
        details: { errorCode: 'TIMEOUT', retryCount: 3 },
      });

      expect(entry.level).toBe('ERROR');
      expect(entry.details).toBeDefined();
      expect(entry.details!.errorCode).toBe('TIMEOUT');
    });

    it('level 미지정 시 기본값 INFO로 기록해야 한다', () => {
      const entry = commLogService.log({
        direction: 'INBOUND',
        sourceId: 'BUSAN',
        targetId: 'RELAY',
        protocol: 'FTP',
        messageType: 'FILE_RECEIVED',
        dataSize: 1024,
        message: '파일 수신 완료',
      });

      expect(entry.level).toBe('INFO');
    });
  });

  // ======================================================
  // 시나리오 2: 필터 기반 로그 조회
  // ======================================================
  describe('필터 기반 로그 조회', () => {
    beforeEach(() => {
      // 다양한 종류의 로그 생성
      commLogService.log({
        direction: 'INBOUND',
        sourceId: 'SIMS',
        targetId: 'RELAY',
        protocol: 'DB2DB',
        messageType: 'RECEPTION_INFO_SYNC',
        dataSize: 2048,
        level: 'INFO',
        message: 'SIMS에서 접수정보 수신',
      });
      commLogService.log({
        direction: 'OUTBOUND',
        sourceId: 'RELAY',
        targetId: 'SEOUL',
        protocol: 'TCP_SOCKET',
        messageType: 'SORTING_RESULT_PUSH',
        dataSize: 4096,
        level: 'INFO',
        message: '서울집중국으로 구분결과 전송',
      });
      commLogService.log({
        direction: 'OUTBOUND',
        sourceId: 'RELAY',
        targetId: 'SIMS',
        protocol: 'DB2DB',
        messageType: 'SYNC_ERROR',
        dataSize: 0,
        level: 'ERROR',
        message: 'SIMS 동기화 오류 발생',
      });
      commLogService.log({
        direction: 'INBOUND',
        sourceId: 'BUSAN',
        targetId: 'RELAY',
        protocol: 'FTP',
        messageType: 'FILE_TRANSFER',
        dataSize: 10240,
        level: 'WARN',
        message: '부산집중국 파일 전송 지연',
      });
    });

    it('방향(direction)별 필터링이 가능해야 한다', () => {
      const inbound = commLogService.getLogs({ direction: 'INBOUND' });
      expect(inbound.total).toBe(2);
      inbound.logs.forEach((log) => {
        expect(log.direction).toBe('INBOUND');
      });

      const outbound = commLogService.getLogs({ direction: 'OUTBOUND' });
      expect(outbound.total).toBe(2);
      outbound.logs.forEach((log) => {
        expect(log.direction).toBe('OUTBOUND');
      });
    });

    it('레벨(level)별 필터링이 가능해야 한다', () => {
      const errors = commLogService.getLogs({ level: 'ERROR' });
      expect(errors.total).toBe(1);
      expect(errors.logs[0].level).toBe('ERROR');

      const warns = commLogService.getLogs({ level: 'WARN' });
      expect(warns.total).toBe(1);
      expect(warns.logs[0].level).toBe('WARN');
    });

    it('프로토콜(protocol)별 필터링이 가능해야 한다', () => {
      const db2db = commLogService.getLogs({ protocol: 'DB2DB' });
      expect(db2db.total).toBe(2);
      db2db.logs.forEach((log) => {
        expect(log.protocol).toBe('DB2DB');
      });

      const ftp = commLogService.getLogs({ protocol: 'FTP' });
      expect(ftp.total).toBe(1);
      expect(ftp.logs[0].protocol).toBe('FTP');
    });

    it('키워드(keyword) 검색이 가능해야 한다', () => {
      const result = commLogService.getLogs({ keyword: '서울' });
      expect(result.total).toBe(1);
      expect(result.logs[0].message).toContain('서울');

      const simsResult = commLogService.getLogs({ keyword: 'SIMS' });
      // sourceId 또는 targetId에 SIMS가 포함된 로그
      expect(simsResult.total).toBeGreaterThanOrEqual(2);
    });

    it('페이지네이션(limit/offset)이 적용되어야 한다', () => {
      const page1 = commLogService.getLogs({ limit: 2, offset: 0 });
      expect(page1.logs.length).toBe(2);
      expect(page1.total).toBe(4);

      const page2 = commLogService.getLogs({ limit: 2, offset: 2 });
      expect(page2.logs.length).toBe(2);
      expect(page2.total).toBe(4);
    });
  });

  // ======================================================
  // 시나리오 3: 로그 통계 조회
  // ======================================================
  describe('로그 통계 조회', () => {
    beforeEach(() => {
      // 통계용 로그 생성
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        level: 'INFO', message: '정상 동기화',
      });
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 2048,
        level: 'INFO', message: '정상 동기화 2',
      });
      commLogService.log({
        direction: 'OUTBOUND', sourceId: 'RELAY', targetId: 'SEOUL',
        protocol: 'TCP_SOCKET', messageType: 'PUSH', dataSize: 512,
        level: 'WARN', message: '전송 지연',
      });
      commLogService.log({
        direction: 'OUTBOUND', sourceId: 'RELAY', targetId: 'SIMS',
        protocol: 'DB2DB', messageType: 'ERROR', dataSize: 0,
        level: 'ERROR', message: '연결 오류',
      });
    });

    it('전체 로그 통계를 반환해야 한다', () => {
      const stats = commLogService.getLogStats();

      expect(stats.totalLogs).toBe(4);

      // 방향별 통계
      expect(stats.byDirection).toHaveProperty('INBOUND');
      expect(stats.byDirection).toHaveProperty('OUTBOUND');
      expect(stats.byDirection['INBOUND']).toBe(2);
      expect(stats.byDirection['OUTBOUND']).toBe(2);

      // 레벨별 통계
      expect(stats.byLevel).toHaveProperty('INFO');
      expect(stats.byLevel).toHaveProperty('WARN');
      expect(stats.byLevel).toHaveProperty('ERROR');
      expect(stats.byLevel['INFO']).toBe(2);
      expect(stats.byLevel['WARN']).toBe(1);
      expect(stats.byLevel['ERROR']).toBe(1);

      // 프로토콜별 통계
      expect(stats.byProtocol).toHaveProperty('DB2DB');
      expect(stats.byProtocol).toHaveProperty('TCP_SOCKET');
      expect(stats.byProtocol['DB2DB']).toBe(3);
    });

    it('최근 에러 로그를 포함해야 한다', () => {
      const stats = commLogService.getLogStats();

      expect(stats.recentErrors).toBeDefined();
      expect(stats.recentErrors.length).toBe(1);
      expect(stats.recentErrors[0].level).toBe('ERROR');
    });
  });

  // ======================================================
  // 시나리오 4: 보존 기간 초과 로그 정리
  // ======================================================
  describe('보존 기간 초과 로그 정리 (60일)', () => {
    it('현재 로그는 정리 대상이 아니어야 한다', () => {
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '최근 로그',
      });

      const deleted = commLogService.cleanupExpiredLogs();
      expect(deleted).toBe(0);

      const result = commLogService.getLogs();
      expect(result.total).toBe(1);
    });

    it('60일 이상 된 로그는 정리되어야 한다', () => {
      // 현재 로그 추가
      commLogService.log({
        direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
        protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
        message: '최근 로그',
      });

      // 만료된 로그를 직접 삽입 (61일 전 타임스탬프)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 61);
      const oldTimestamp = oldDate.toISOString();

      // 내부 logs 배열에 직접 접근하여 만료 로그 추가
      (commLogService as any).logs.push({
        id: 'LOG_OLD_1',
        timestamp: oldTimestamp,
        direction: 'INBOUND',
        sourceId: 'SIMS',
        targetId: 'RELAY',
        protocol: 'DB2DB',
        messageType: 'OLD_SYNC',
        dataSize: 512,
        level: 'INFO',
        message: '61일 전 로그',
      });

      const before = commLogService.getLogs({ limit: 100 });
      expect(before.total).toBe(2);

      const deleted = commLogService.cleanupExpiredLogs();
      expect(deleted).toBe(1);

      const after = commLogService.getLogs({ limit: 100 });
      expect(after.total).toBe(1);
    });

    it('최근 로그(실시간 스트림용)를 조회할 수 있어야 한다', () => {
      // 여러 로그 추가
      for (let i = 0; i < 30; i++) {
        commLogService.log({
          direction: 'INBOUND', sourceId: 'SIMS', targetId: 'RELAY',
          protocol: 'DB2DB', messageType: 'SYNC', dataSize: 1024,
          message: `로그 #${i}`,
        });
      }

      const recent = commLogService.getRecentLogs(20);
      expect(recent.length).toBe(20);

      // 가장 최근 로그가 먼저 와야 한다
      expect(recent[0].message).toBe('로그 #29');

      const fewer = commLogService.getRecentLogs(5);
      expect(fewer.length).toBe(5);
    });
  });
});
