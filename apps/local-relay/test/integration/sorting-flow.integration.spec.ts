import { Test, TestingModule } from '@nestjs/testing';
import { PLCConnectionService } from '../../src/plc-connection/plc-connection.service';
import { IPSService } from '../../src/ips/ips.service';
import { SimulatorService } from '../../src/simulator/simulator.service';
import { EquipmentMonitorService } from '../../src/equipment-monitor/equipment-monitor.service';
import { OperationService } from '../../src/operation/operation.service';

/**
 * 구분 흐름 통합 테스트 (시나리오 1)
 * - 전체 구분 사이클: 투입 -> 바코드 판독 -> 목적지 결정 -> 구분 완료
 * - PLC 연결 -> 운영 시작
 * - 연속 우편물 처리
 */
describe('구분 흐름(Sorting Flow) 통합 테스트', () => {
  let plcService: PLCConnectionService;
  let ipsService: IPSService;
  let simulatorService: SimulatorService;
  let eqService: EquipmentMonitorService;
  let operationService: OperationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PLCConnectionService,
        IPSService,
        SimulatorService,
        EquipmentMonitorService,
        OperationService,
      ],
    }).compile();

    plcService = module.get<PLCConnectionService>(PLCConnectionService);
    ipsService = module.get<IPSService>(IPSService);
    simulatorService = module.get<SimulatorService>(SimulatorService);
    eqService = module.get<EquipmentMonitorService>(EquipmentMonitorService);
    operationService = module.get<OperationService>(OperationService);

    plcService.onModuleInit();
  });

  afterEach(() => {
    simulatorService.stop();
    plcService.onModuleDestroy();
  });

  // 테스트 1: 전체 구분 사이클 - 투입 -> 바코드 판독 -> 목적지 결정 -> 구분 완료
  it('투입 → 바코드 판독 → 목적지 결정 → 구분 완료 전체 사이클이 동작해야 한다', () => {
    // 1단계: PLC 채널 연결
    plcService.connectAll();
    expect(plcService.getConnectedCount()).toBe(7);

    // 2단계: 장비 가동
    eqService.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120 });
    eqService.updateStatus('IND-01', { status: 'RUNNING', speed: 80 });
    expect(eqService.getEquipment('SORTER-01')!.status).toBe('RUNNING');

    // 3단계: 우편물 투입 - PLC 전문 송신 (투입 신호)
    const inductionSignal = Buffer.from([0x02, 0x14, 0x01, 0x03]); // T20: 투입 신호
    const sent = plcService.sendTelegram('SEND_DESTINATION', 20, inductionSignal);
    expect(sent).toBe(true);

    // 4단계: 바코드 판독 (IPS에서 바코드 읽기)
    const readResult = ipsService.processRead('IPS-IND01', '4201234567890', 'CODE128', 98, 95, 10);
    expect(readResult.status).toBe('SUCCESS');
    expect(readResult.barcode).toBe('4201234567890');

    // 5단계: 목적지 결정 - 시뮬레이터로 슈트 배정
    const sortResult = simulatorService.simulateOne('4201234567890', '42012');
    expect(sortResult.result).toBeDefined();
    expect(sortResult.assignedChute).toBeGreaterThan(0);

    // 6단계: 구분 완료 전문 수신
    const sortComplete = Buffer.from([0x02, 0x16, 0x01, 0x03]); // T22: 구분 완료
    plcService.receiveTelegram('SEND_DESTINATION', 22, sortComplete);

    // 7단계: 처리 카운트 증가
    eqService.incrementProcessed('SORTER-01', 1);
    expect(eqService.getEquipment('SORTER-01')!.processedCount).toBe(1);

    // 전문 로그 확인 (송신 1 + 수신 1)
    const log = plcService.getTelegramLog();
    expect(log.length).toBe(2);
  });

  // 테스트 2: PLC 연결 → 운영 모드 전환
  it('PLC 연결 후 운영 모드로 전환할 수 있어야 한다', async () => {
    // 초기 모드: SIMULATOR
    expect(operationService.getCurrentMode()).toBe('SIMULATOR');

    // 운영 모드 전환 (안전 검사 통과)
    const result = await operationService.switchMode('OPERATION', 'admin', '구분 시작');
    expect(result.success).toBe(true);
    expect(result.safetyCheck.passed).toBe(true);
    expect(operationService.getCurrentMode()).toBe('OPERATION');

    // PLC 전체 채널이 연결되어야 함
    expect(plcService.getConnectedCount()).toBe(7);

    // 운영 상태 확인
    const status = operationService.getStatus();
    expect(status.mode).toBe('OPERATION');
    expect(status.plcConnected).toBe(7);
    expect(status.simulatorRunning).toBe(false);
  });

  // 테스트 3: 연속 우편물 처리 (다건)
  it('연속적으로 여러 우편물을 처리할 수 있어야 한다', () => {
    plcService.connectAll();
    eqService.updateStatus('SORTER-01', { status: 'RUNNING' });

    const barcodes = [
      '4201111111111',
      '4202222222222',
      '4203333333333',
      '4204444444444',
      '4205555555555',
    ];

    // 5건 연속 처리
    for (let i = 0; i < barcodes.length; i++) {
      // 투입 전문
      plcService.sendTelegram('SEND_DESTINATION', 20, Buffer.from([0x02, 0x14, i + 1, 0x03]));

      // 바코드 판독
      const readResult = ipsService.processRead(
        `IPS-IND0${(i % 4) + 1}`,
        barcodes[i],
        'CODE128',
        95,
        90,
        10 + i,
      );
      expect(readResult.status).toBe('SUCCESS');

      // 구분 시뮬레이션
      const sortResult = simulatorService.simulateOne(barcodes[i]);
      expect(sortResult.pid).toBeGreaterThan(100000);

      // 구분 완료 수신
      plcService.receiveTelegram('SEND_DESTINATION', 22, Buffer.from([0x02, 0x16, i + 1, 0x03]));

      // 처리 카운트 증가
      eqService.incrementProcessed('SORTER-01', 1);
    }

    // 결과 검증
    expect(ipsService.getOverallStats().totalReads).toBe(5);
    expect(ipsService.getOverallStats().successRate).toBe(100);
    expect(eqService.getEquipment('SORTER-01')!.processedCount).toBe(5);
    expect(plcService.getTelegramLog().length).toBe(10); // 5 send + 5 receive
    expect(simulatorService.getItems().length).toBe(5);
  });

  // 테스트 4: 바코드 미인식 시 리젝트 처리 흐름
  it('바코드 미인식 시 리젝트 슈트로 배출되어야 한다', () => {
    plcService.connectAll();

    // 투입 전문
    plcService.sendTelegram('SEND_DESTINATION', 20, Buffer.from([0x02, 0x14, 0x01, 0x03]));

    // 바코드 미인식
    const readResult = ipsService.processRead('IPS-IND01', '', 'UNKNOWN', 0, 0, 50);
    expect(readResult.status).toBe('NO_READ');

    // NO_READ 시뮬레이션 → 리젝트 슈트(0) 배정
    const sortResult = simulatorService.simulateOne('');
    expect(sortResult.result).toBe('NO_READ');
    expect(sortResult.assignedChute).toBe(0);

    // 디바이스 통계 확인
    const device = ipsService.getDevice('IPS-IND01');
    expect(device!.totalReads).toBe(1);
    expect(device!.failedReads).toBe(1);
    expect(device!.successRate).toBe(0);
  });

  // 테스트 5: 구분기 장비 상태 변경과 처리 연동
  it('구분기 장비 상태가 처리 통계와 연동되어야 한다', () => {
    plcService.connectAll();

    // 장비 가동
    eqService.updateStatus('SORTER-01', { status: 'RUNNING', speed: 120, temperature: 35 });
    eqService.updateStatus('IND-01', { status: 'RUNNING', speed: 80 });
    eqService.updateStatus('IND-02', { status: 'RUNNING', speed: 80 });

    // 시스템 개요 확인
    let overview = eqService.getSystemOverview();
    expect(overview.running).toBe(3);
    expect(overview.totalProcessed).toBe(0);

    // 10건 처리 시뮬레이션
    for (let i = 0; i < 10; i++) {
      ipsService.processRead(`IPS-IND0${(i % 4) + 1}`, `42012345678${i}0`, 'CODE128', 95, 90, 10);
      eqService.incrementProcessed('SORTER-01', 1);
    }

    // 최종 상태 확인
    overview = eqService.getSystemOverview();
    expect(overview.totalProcessed).toBe(10);
    expect(ipsService.getOverallStats().totalReads).toBe(10);

    const plcStatus = plcService.getStatus();
    expect(plcStatus.connected).toBe(7);
  });
});
