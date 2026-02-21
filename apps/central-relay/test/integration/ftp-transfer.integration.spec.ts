import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FtpService } from '../../src/ftp/ftp.service';

/**
 * FTP 파일 전송 서비스 통합 테스트
 * - 배달점주소DB 배포
 * - MLF 파일 / 구분계획 배포
 * - 전송 이력 조회 및 필터링
 * - 전송 상태 요약 확인
 */
describe('FtpService 파일 전송 통합 테스트', () => {
  let app: INestApplication;
  let ftpService: FtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FtpService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    ftpService = module.get<FtpService>(FtpService);
  });

  afterEach(async () => {
    await app.close();
  });

  // ======================================================
  // 시나리오 1: 배달점주소DB 파일 배포
  // ======================================================
  describe('배달점주소DB 파일 배포', () => {
    it('여러 집중국에 주소DB를 배포해야 한다', async () => {
      const targetCenters = ['SEOUL', 'BUSAN', 'DAEGU'];
      const results = await ftpService.distributeAddressDB(
        '/data/address/delivery_address_20260219.db',
        targetCenters,
      );

      expect(results.length).toBe(3);

      for (const record of results) {
        expect(record.fileType).toBe('ADDRESS_DB');
        expect(record.direction).toBe('UPLOAD');
        expect(record.transferId).toMatch(/^FTP_/);
        expect(record.status).toBe('COMPLETED');
        expect(record.fileName).toBe('delivery_address_20260219.db');
      }

      // 각 센터에 대한 전송이 올바르게 생성됐는지 확인
      const targetIds = results.map((r) => r.targetId);
      expect(targetIds).toContain('SEOUL');
      expect(targetIds).toContain('BUSAN');
      expect(targetIds).toContain('DAEGU');
    });

    it('단일 집중국에 주소DB를 배포해야 한다', async () => {
      const results = await ftpService.distributeAddressDB(
        '/data/address/delivery_address_20260219.db',
        ['GWANGJU'],
      );

      expect(results.length).toBe(1);
      expect(results[0].targetId).toBe('GWANGJU');
      expect(results[0].fileType).toBe('ADDRESS_DB');
      expect(results[0].status).toBe('COMPLETED');
    });
  });

  // ======================================================
  // 시나리오 2: MLF 파일 및 구분계획 배포
  // ======================================================
  describe('MLF 파일 및 구분계획 배포', () => {
    it('MLF 파일을 집중국에 배포해야 한다', async () => {
      const results = await ftpService.distributeMLFFile(
        '/data/mlf/mlf_20260219.dat',
        ['SEOUL', 'DAEJEON'],
      );

      expect(results.length).toBe(2);
      for (const record of results) {
        expect(record.fileType).toBe('MLF');
        expect(record.direction).toBe('UPLOAD');
        expect(record.status).toBe('COMPLETED');
        expect(record.fileName).toBe('mlf_20260219.dat');
      }
    });

    it('구분계획 파일을 전체 집중국에 배포해야 한다', async () => {
      const allCenters = ['SEOUL', 'BUSAN', 'DAEGU', 'GWANGJU', 'DAEJEON'];
      const results = await ftpService.distributeSortingPlan(
        '/data/plan/sorting_plan_20260219.csv',
        allCenters,
      );

      expect(results.length).toBe(5);
      for (const record of results) {
        expect(record.fileType).toBe('SORTING_PLAN');
        expect(record.direction).toBe('UPLOAD');
        expect(record.status).toBe('COMPLETED');
      }
    });
  });

  // ======================================================
  // 시나리오 3: 전송 이력 조회 및 필터링
  // ======================================================
  describe('전송 이력 조회 및 필터링', () => {
    it('전송 완료 후 이력에 기록되어야 한다', async () => {
      await ftpService.distributeAddressDB('/data/addr.db', ['SEOUL']);
      await ftpService.distributeMLFFile('/data/mlf.dat', ['BUSAN']);

      const history = ftpService.getTransferHistory();
      expect(history.length).toBe(2);

      // 이력 항목 구조 검증
      const entry = history[0];
      expect(entry).toHaveProperty('transferId');
      expect(entry).toHaveProperty('fileName');
      expect(entry).toHaveProperty('fileType');
      expect(entry).toHaveProperty('direction');
      expect(entry).toHaveProperty('targetId');
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('startedAt');
      expect(entry).toHaveProperty('completedAt');
    });

    it('파일 타입별 이력 필터링이 가능해야 한다', async () => {
      await ftpService.distributeAddressDB('/data/addr.db', ['SEOUL']);
      await ftpService.distributeMLFFile('/data/mlf.dat', ['BUSAN']);
      await ftpService.distributeSortingPlan('/data/plan.csv', ['DAEGU']);

      const addrHistory = ftpService.getTransferHistory({
        fileType: 'ADDRESS_DB',
      });
      expect(addrHistory.length).toBe(1);
      expect(addrHistory[0].fileType).toBe('ADDRESS_DB');

      const mlfHistory = ftpService.getTransferHistory({ fileType: 'MLF' });
      expect(mlfHistory.length).toBe(1);
      expect(mlfHistory[0].fileType).toBe('MLF');

      const planHistory = ftpService.getTransferHistory({
        fileType: 'SORTING_PLAN',
      });
      expect(planHistory.length).toBe(1);
      expect(planHistory[0].fileType).toBe('SORTING_PLAN');
    });

    it('이력 조회 시 limit 제한이 적용되어야 한다', async () => {
      await ftpService.distributeAddressDB('/data/addr.db', [
        'SEOUL',
        'BUSAN',
        'DAEGU',
      ]);

      const limited = ftpService.getTransferHistory({ limit: 2 });
      expect(limited.length).toBe(2);
    });
  });

  // ======================================================
  // 시나리오 4: 전송 상태 요약 확인
  // ======================================================
  describe('전송 상태 요약 확인', () => {
    it('전송 상태 요약을 반환해야 한다', async () => {
      await ftpService.distributeAddressDB('/data/addr.db', ['SEOUL']);
      await ftpService.distributeMLFFile('/data/mlf.dat', ['BUSAN']);

      const status = ftpService.getTransferStatus();

      expect(status).toHaveProperty('active');
      expect(status).toHaveProperty('completed');
      expect(status).toHaveProperty('failed');
      expect(status).toHaveProperty('totalBytesTransferred');

      // 전송이 완료되었으므로 active는 0
      expect(status.active).toBe(0);
      expect(status.completed).toBe(2);
      expect(status.failed).toBe(0);
    });

    it('초기 상태에서는 모든 카운터가 0이어야 한다', () => {
      const status = ftpService.getTransferStatus();

      expect(status.active).toBe(0);
      expect(status.completed).toBe(0);
      expect(status.failed).toBe(0);
      expect(status.totalBytesTransferred).toBe(0);
    });

    it('활성 전송 목록은 전송 완료 후 비어야 한다', async () => {
      await ftpService.distributeAddressDB('/data/addr.db', ['SEOUL']);

      const active = ftpService.getActiveTransfers();
      expect(active).toEqual([]);
    });
  });
});
