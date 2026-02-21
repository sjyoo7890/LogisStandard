import { Test, TestingModule } from '@nestjs/testing';
import { FtpService } from './ftp.service';

describe('FtpService', () => {
  let service: FtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FtpService],
    }).compile();

    service = module.get<FtpService>(FtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should distribute address DB to multiple centers', async () => {
    const results = await service.distributeAddressDB(
      '/tmp/test_address.db',
      ['SEOUL', 'BUSAN'],
    );
    expect(results.length).toBe(2);
    expect(results[0].fileType).toBe('ADDRESS_DB');
    expect(results[0].direction).toBe('UPLOAD');
  });

  it('should distribute MLF file', async () => {
    const results = await service.distributeMLFFile(
      '/tmp/test_mlf.dat',
      ['SEOUL'],
    );
    expect(results.length).toBe(1);
    expect(results[0].fileType).toBe('MLF');
  });

  it('should distribute sorting plan', async () => {
    const results = await service.distributeSortingPlan(
      '/tmp/test_plan.csv',
      ['DAEGU', 'GWANGJU'],
    );
    expect(results.length).toBe(2);
    expect(results[0].fileType).toBe('SORTING_PLAN');
  });

  it('should have no active transfers initially', () => {
    const active = service.getActiveTransfers();
    expect(active).toEqual([]);
  });

  it('should track transfer history', async () => {
    await service.distributeAddressDB('/tmp/test.db', ['SEOUL']);
    const history = service.getTransferHistory();
    expect(history.length).toBe(1);
  });

  it('should return transfer status summary', async () => {
    await service.distributeAddressDB('/tmp/test.db', ['SEOUL']);
    const status = service.getTransferStatus();
    expect(status).toHaveProperty('active');
    expect(status).toHaveProperty('completed');
    expect(status).toHaveProperty('failed');
    expect(status).toHaveProperty('totalBytesTransferred');
  });

  it('should filter history by file type', async () => {
    await service.distributeAddressDB('/tmp/addr.db', ['SEOUL']);
    await service.distributeMLFFile('/tmp/mlf.dat', ['BUSAN']);

    const addrOnly = service.getTransferHistory({ fileType: 'ADDRESS_DB' });
    expect(addrOnly.length).toBe(1);
    expect(addrOnly[0].fileType).toBe('ADDRESS_DB');
  });
});
