import { Test, TestingModule } from '@nestjs/testing';
import { IPSService } from '../../src/ips/ips.service';

/**
 * IPS/BCR 바코드 판독 통합 테스트 (시나리오 1)
 * - 바코드 판독 처리
 * - 디바이스 상태 관리
 * - 판독 이력 조회
 * - 통계 계산
 * - 알람 등록/해제
 */
describe('IPSService 바코드 판독 통합 테스트', () => {
  let service: IPSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IPSService],
    }).compile();

    service = module.get<IPSService>(IPSService);
  });

  // 테스트 1: 바코드 판독 처리 - 정상/미인식/다중판독 시나리오
  it('바코드 판독 결과가 상태별로 올바르게 분류되어야 한다', () => {
    // 정상 판독 (SUCCESS) - confidence >= 50
    const success = service.processRead('IPS-IND01', '4201234567890', 'CODE128', 95, 92, 12);
    expect(success.status).toBe('SUCCESS');
    expect(success.barcode).toBe('4201234567890');
    expect(success.barcodeType).toBe('CODE128');
    expect(success.confidence).toBe(95);
    expect(success.quality).toBe(92);
    expect(success.readTimeMs).toBe(12);
    expect(success.inductionNo).toBe(1);
    expect(success.readId).toBeDefined();
    expect(success.triggerId).toBeDefined();

    // 미인식 (NO_READ) - 빈 바코드
    const noRead = service.processRead('IPS-IND02', '', 'UNKNOWN', 0, 0, 50);
    expect(noRead.status).toBe('NO_READ');
    expect(noRead.barcode).toBe('');
    expect(noRead.inductionNo).toBe(2);

    // 다중 판독 (MULTI_READ) - 슬래시 포함
    const multiRead = service.processRead('IPS-IND03', '420123/630456', 'CODE128', 72, 60, 22);
    expect(multiRead.status).toBe('MULTI_READ');

    // 낮은 신뢰도 (ERROR) - confidence < 50
    const errorRead = service.processRead('IPS-IND04', '9901234567890', 'EAN128', 30, 20, 45);
    expect(errorRead.status).toBe('ERROR');
  });

  // 테스트 2: 디바이스 상태 관리
  it('디바이스 상태를 변경하고 조회할 수 있어야 한다', () => {
    // 초기 상태: 4개 디바이스 전부 ONLINE
    const devices = service.getAllDevices();
    expect(devices.length).toBe(4);
    for (const d of devices) {
      expect(d.status).toBe('ONLINE');
    }

    // 상태 변경
    expect(service.setDeviceStatus('IPS-IND01', 'MAINTENANCE')).toBe(true);
    const device = service.getDevice('IPS-IND01');
    expect(device).toBeDefined();
    expect(device!.status).toBe('MAINTENANCE');

    // OFFLINE으로 변경
    expect(service.setDeviceStatus('IPS-IND02', 'OFFLINE')).toBe(true);
    expect(service.getDevice('IPS-IND02')!.status).toBe('OFFLINE');

    // 존재하지 않는 디바이스
    expect(service.setDeviceStatus('UNKNOWN', 'ONLINE')).toBe(false);
    expect(service.getDevice('UNKNOWN')).toBeUndefined();
  });

  // 테스트 3: 판독 이력 조회 및 필터링
  it('판독 이력을 필터링하여 조회할 수 있어야 한다', () => {
    // 여러 건의 판독 처리
    service.processRead('IPS-IND01', '4201111111111', 'CODE128', 98, 95, 10);
    service.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    service.processRead('IPS-IND02', '4202222222222', 'CODE128', 90, 88, 15);
    service.processRead('IPS-IND03', '4203333333333', 'QR', 85, 80, 20);
    service.processRead('IPS-IND01', '4204444444444', 'CODE128', 92, 90, 11);

    // 전체 이력 조회
    const allHistory = service.getReadHistory();
    expect(allHistory.length).toBe(5);

    // 디바이스별 필터 (IPS-IND01 = inductionNo 1)
    const ind01History = service.getReadHistory({ deviceId: 'IPS-IND01' });
    expect(ind01History.length).toBe(3);

    // 상태별 필터
    const successOnly = service.getReadHistory({ status: 'SUCCESS' });
    expect(successOnly.length).toBe(4);

    const noReadOnly = service.getReadHistory({ status: 'NO_READ' });
    expect(noReadOnly.length).toBe(1);

    // 개수 제한
    const limited = service.getReadHistory({ limit: 2 });
    expect(limited.length).toBe(2);
  });

  // 테스트 4: 통계 계산 검증
  it('판독 통계가 정확하게 계산되어야 한다', () => {
    // 10건 판독: 7건 성공, 2건 미인식, 1건 에러
    for (let i = 0; i < 7; i++) {
      service.processRead('IPS-IND01', `42012345678${i}0`, 'CODE128', 95, 90, 10 + i);
    }
    service.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    service.processRead('IPS-IND02', '', 'UNKNOWN', 0, 0, 55);
    service.processRead('IPS-IND03', '9900000000000', 'EAN128', 20, 10, 40);

    const stats = service.getOverallStats();
    expect(stats.totalReads).toBe(10);
    expect(stats.successRate).toBe(70); // 7/10 * 100
    expect(stats.avgReadTime).toBeGreaterThan(0);

    // 디바이스별 성공률
    const ind01 = service.getDevice('IPS-IND01');
    expect(ind01!.totalReads).toBe(8); // 7 성공 + 1 미인식
    expect(ind01!.successReads).toBe(7);
    expect(ind01!.failedReads).toBe(1);
    expect(ind01!.successRate).toBeCloseTo(87.5, 1);
  });

  // 테스트 5: 알람 등록/해제 및 상태 연동
  it('알람 등록 시 ERROR 상태로 전환되고 해제 시 ONLINE으로 복구되어야 한다', () => {
    // 초기 상태 ONLINE 확인
    expect(service.getDevice('IPS-IND01')!.status).toBe('ONLINE');

    // 알람 등록 → 상태가 ERROR로 변경
    const added = service.addAlarm('IPS-IND01', '센서 차단 감지');
    expect(added).toBe(true);

    let device = service.getDevice('IPS-IND01')!;
    expect(device.status).toBe('ERROR');
    expect(device.alarms.length).toBe(1);
    expect(device.alarms[0]).toBe('센서 차단 감지');

    // 추가 알람 등록
    service.addAlarm('IPS-IND01', '통신 타임아웃');
    device = service.getDevice('IPS-IND01')!;
    expect(device.alarms.length).toBe(2);

    // 알람 클리어 → 상태 ONLINE 복구
    const cleared = service.clearAlarms('IPS-IND01');
    expect(cleared).toBe(true);

    device = service.getDevice('IPS-IND01')!;
    expect(device.alarms.length).toBe(0);
    expect(device.status).toBe('ONLINE');

    // 존재하지 않는 디바이스 알람 등록 실패
    expect(service.addAlarm('UNKNOWN', '테스트')).toBe(false);
    expect(service.clearAlarms('UNKNOWN')).toBe(false);
  });
});
