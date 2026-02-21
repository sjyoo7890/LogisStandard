import { Test, TestingModule } from '@nestjs/testing';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';
import { IPSService } from '../../src/ips/ips.service';
import { SimulatorService } from '../../src/simulator/simulator.service';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';

/**
 * 타건 처리 흐름 통합 테스트 (시나리오 2)
 * - 바코드 판독 실패 -> 타건 요청
 * - 타건기 표시 -> 수동 입력
 * - 타건 결과 반영 -> 구분 완료
 */
describe('타건 처리 흐름(Keying Flow) 통합 테스트', () => {
  let plcService: PLCConnectionService;
  let ipsService: IPSService;
  let simulatorService: SimulatorService;
  let eqService: EquipmentMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PLCConnectionService,
        IPSService,
        SimulatorService,
        EquipmentMonitorService,
      ],
    }).compile();

    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    ipsService = module.get<IPSService>(IPSService);
    simulatorService = module.get<SimulatorService>(SimulatorService);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);

    plcService.onModuleInit();
    plcService.connectAll();
  });

  afterEach(() => {
    simulatorService.stop();
    plcService.onModuleDestroy();
  });

  // 테스트 1: 바코드 판독 실패 → 타건 요청 흐름
  it('바코드 미인식 시 타건 요청 전문이 발송되어야 한다', () => {
    // 1단계: 우편물 투입
    plcService.sendTelegram('SEND_DESTINATION', 20, Buffer.from([0x02, 0x14, 0x01, 0x03]));

    // 2단계: 바코드 판독 실패 (NO_READ)
    const readResult = ipsService.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    expect(readResult.status).toBe('NO_READ');

    // 3단계: NO_READ 확인 → 타건 요청 전문 송신
    // 타건 요청 전문 (우편물 이미지/정보를 타건기로 전송)
    const keyingRequest = Buffer.from([0x02, 0x28, 0x01, 0x00, 0x03]); // T40: 타건 요청
    const sent = plcService.sendTelegram('SEND_DESTINATION', 40, keyingRequest);
    expect(sent).toBe(true);

    // 전문 로그에 투입 전문 + 타건 요청 전문 기록
    const log = plcService.getTelegramLog();
    expect(log.length).toBe(2);
    expect(log[0].telegramNo).toBe(40); // 최신 (타건 요청)
    expect(log[1].telegramNo).toBe(20); // 이전 (투입 신호)
  });

  // 테스트 2: 타건기 표시 및 수동 입력 시뮬레이션
  it('타건기에서 수동 입력된 우편번호로 구분이 수행되어야 한다', () => {
    // 바코드 미인식
    const readResult = ipsService.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    expect(readResult.status).toBe('NO_READ');

    // 타건 요청 전문 발송
    plcService.sendTelegram('SEND_DESTINATION', 40, Buffer.from([0x02, 0x28, 0x01, 0x03]));

    // 타건기에서 수동 입력한 우편번호: 34000 (대전)
    const manualBarcode = '34000';

    // 수동 입력된 바코드로 구분 시뮬레이션
    simulatorService.setRule('RANGE');
    const sortResult = simulatorService.simulateOne(manualBarcode, '34000');
    expect(sortResult.barcode).toBe(manualBarcode);
    expect(sortResult.result).toBeDefined();

    // 타건 응답 전문 수신 (타건기 → 시스템)
    const keyingResponse = Buffer.from([0x02, 0x29, 0x01, 0x34, 0x30, 0x30, 0x30, 0x03]); // 34000
    plcService.receiveTelegram('SEND_DESTINATION', 41, keyingResponse);

    // 전문 로그 확인
    const log = plcService.getTelegramLog();
    const sendLogs = log.filter((l) => l.direction === 'SEND');
    const recvLogs = log.filter((l) => l.direction === 'RECEIVE');
    expect(sendLogs.length).toBe(1);
    expect(recvLogs.length).toBe(1);
  });

  // 테스트 3: 타건 결과 반영 → 구분 완료
  it('타건 결과가 반영되어 최종 구분이 완료되어야 한다', () => {
    // 1단계: 바코드 미인식
    ipsService.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);

    // 2단계: 타건 요청
    plcService.sendTelegram('SEND_DESTINATION', 40, Buffer.from([0x02, 0x28, 0x01, 0x03]));

    // 3단계: 타건 입력 결과 수신 → 재판독 처리
    // 타건기에서 입력한 바코드로 다시 processRead 처리
    const manualRead = ipsService.processRead('IPS-IND01', '4201234567890', 'CODE128', 100, 100, 0);
    expect(manualRead.status).toBe('SUCCESS');

    // 4단계: 시뮬레이터로 구분 수행
    const sortResult = simulatorService.simulateOne('4201234567890', '42012');
    expect(sortResult.result).not.toBe('NO_READ');

    // 5단계: 구분 완료 전문 송신
    plcService.sendTelegram('SEND_DESTINATION', 22, Buffer.from([0x02, 0x16, 0x01, 0x03]));
    eqService.incrementProcessed('SORTER-01', 1);

    // 최종 검증: IPS-IND01 디바이스 통계
    const device = ipsService.getDevice('IPS-IND01');
    expect(device!.totalReads).toBe(2); // 미인식 1 + 수동입력 1
    expect(device!.successReads).toBe(1);
    expect(device!.failedReads).toBe(1);
    expect(device!.successRate).toBe(50);

    // 처리 카운트
    expect(eqService.getEquipment('SORTER-01')!.processedCount).toBe(1);
  });

  // 테스트 4: 연속 타건 시나리오 (다수 미인식)
  it('연속된 미인식 우편물이 타건 처리로 모두 구분되어야 한다', () => {
    const noReadBarcodes = ['', '', '', '']; // 4건 미인식
    const manualBarcodes = ['34001', '42050', '06100', '13200']; // 타건 입력 값

    for (let i = 0; i < noReadBarcodes.length; i++) {
      // 미인식 판독
      const noRead = ipsService.processRead(`IPS-IND0${(i % 4) + 1}`, '', 'UNKNOWN', 0, 0, 50);
      expect(noRead.status).toBe('NO_READ');

      // 타건 요청 전문
      plcService.sendTelegram('SEND_DESTINATION', 40, Buffer.from([0x02, 0x28, i + 1, 0x03]));

      // 타건 결과 → 재판독
      const manualRead = ipsService.processRead(
        `IPS-IND0${(i % 4) + 1}`,
        manualBarcodes[i],
        'CODE128',
        100,
        100,
        0,
      );
      expect(manualRead.status).toBe('SUCCESS');

      // 구분 수행
      const sortResult = simulatorService.simulateOne(manualBarcodes[i]);
      expect(sortResult.barcode).toBe(manualBarcodes[i]);

      // 구분 완료
      eqService.incrementProcessed('SORTER-01', 1);
    }

    // 최종 통계: 8건 판독 (4 NO_READ + 4 SUCCESS)
    const stats = ipsService.getOverallStats();
    expect(stats.totalReads).toBe(8);
    expect(stats.successRate).toBe(50); // 4/8 * 100

    // 구분기 처리 카운트
    expect(eqService.getEquipment('SORTER-01')!.processedCount).toBe(4);
  });
});
