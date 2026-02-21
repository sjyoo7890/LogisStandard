import {
  TelegramBuilder,
  TelegramParser,
  TelegramValidator,
  TelegramRegistry,
  STX,
  ETX,
  HEADER_SIZE,
  // PLC → SMC 전문 정의
  TELEGRAM_1_DEF,
  TELEGRAM_10_DEF,
  TELEGRAM_11_DEF,
  TELEGRAM_12_DEF,
  TELEGRAM_20_DEF,
  TELEGRAM_21_DEF,
  TELEGRAM_22_DEF,
  TELEGRAM_40_DEF,
  // SMC → PLC 전문 정의
  TELEGRAM_30_DEF,
  TELEGRAM_41_DEF,
  TELEGRAM_100_DEF,
  TELEGRAM_101_DEF,
  TELEGRAM_110_DEF,
  TELEGRAM_111_DEF,
  TELEGRAM_120_DEF,
  TELEGRAM_121_DEF,
  TELEGRAM_130_DEF,
  TELEGRAM_131_DEF,
  TELEGRAM_140_DEF,
  TELEGRAM_141_DEF,
  TelegramDirection,
} from '@kpost/telegram';

/**
 * 전문 빌드/파싱 라운드트립 통합 테스트
 *
 * TelegramBuilder로 생성한 Buffer를 TelegramParser로 다시 파싱하여
 * 원본 데이터와 동일한지 검증합니다. 전문 유효성 검증도 함께 수행합니다.
 *
 * 별도의 NestJS 의존성 없이 순수 라이브러리 수준 테스트입니다.
 */

describe('전문 빌드/파싱 라운드트립 통합 테스트', () => {

  // 테스트 1: 전문 빌드 → 파싱 라운드트립 (기본)
  describe('전문 빌드 → 파싱 라운드트립', () => {
    it('Telegram 1 (HeartBeat) 빌드 후 파싱하면 원본 데이터와 일치해야 한다', () => {
      const originalData = { acknowledgeStatus: 0, heartBeatNo: 12345 };

      // 빌드
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_1_DEF, originalData);

      // 유효성 검증
      const validation = TelegramValidator.validate(buffer, TELEGRAM_1_DEF);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);

      // 파싱
      const parsed = TelegramParser.parse(buffer, TELEGRAM_1_DEF);

      // 헤더 검증
      expect(parsed.header.stx).toBe(STX);
      expect(parsed.header.telegramNo).toBe(1);
      expect(parsed.header.moduleId).toContain('PSM00');
      expect(parsed.etx).toBe(ETX);

      // 데이터 검증
      const data = parsed.data as Record<string, number>;
      expect(data.acknowledgeStatus).toBe(originalData.acknowledgeStatus);
      expect(data.heartBeatNo).toBe(originalData.heartBeatNo);
    });

    it('Telegram 20 (ItemInducted) 빌드 후 파싱하면 모든 필드가 일치해야 한다', () => {
      const originalData = {
        cellIndex: 100,
        inductionNo: 1,
        mode: 0,
        pid: 100001,
        cartNumber: 0,
        destination1: 42,
        destination2: 0,
        destination3: 0,
        destination4: 0,
        destination5: 0,
        destination6: 0,
        destination7: 0,
        destination8: 0,
      };

      const buffer = TelegramBuilder.quickBuild(TELEGRAM_20_DEF, originalData);
      const validation = TelegramValidator.validate(buffer, TELEGRAM_20_DEF);
      expect(validation.valid).toBe(true);

      const parsed = TelegramParser.parse(buffer, TELEGRAM_20_DEF);
      const data = parsed.data as Record<string, number>;

      // 모든 필드를 비교한다
      for (const [key, value] of Object.entries(originalData)) {
        expect(data[key]).toBe(value);
      }
    });

    it('Telegram 22 (ItemSortedConfirm) 빌드 후 autoParse로 파싱 가능해야 한다', () => {
      const originalData = {
        cellIndex: 50,
        mode: 0,
        chuteNumber: 25,
        recirculationCount: 0,
        status: 0,
      };

      const buffer = TelegramBuilder.quickBuild(TELEGRAM_22_DEF, originalData);

      // autoParse는 전문 번호를 자동으로 감지하여 파싱한다
      const parsed = TelegramParser.autoParse(buffer);

      expect(parsed.header.telegramNo).toBe(22);

      const data = parsed.data as Record<string, number>;
      expect(data.cellIndex).toBe(50);
      expect(data.chuteNumber).toBe(25);
      expect(data.status).toBe(0);
    });
  });

  // 테스트 2: SMC → PLC 전문 (101~141) 라운드트립
  describe('SMC → PLC 전문 (101~141) 라운드트립', () => {
    const smcToPLCTestCases: Array<{
      name: string;
      def: any;
      data: Record<string, number>;
    }> = [
      {
        name: 'Telegram 101 (SetControlSorterAck)',
        def: TELEGRAM_101_DEF,
        data: { request: 1, reason: 0 },
      },
      {
        name: 'Telegram 111 (SetControlInductionAck)',
        def: TELEGRAM_111_DEF,
        data: { inductionNo: 1, status: 1, reason: 0 },
      },
      {
        name: 'Telegram 121 (SetInductionModeAck)',
        def: TELEGRAM_121_DEF,
        data: { inductionNo: 2, request: 1 },
      },
      {
        name: 'Telegram 131 (SetOverflowConfigAck)',
        def: TELEGRAM_131_DEF,
        data: { overflowChute1: 90, overflowChute2: 91, maxRecirculation: 3, reason: 0 },
      },
      {
        name: 'Telegram 141 (SetResetRequestAck)',
        def: TELEGRAM_141_DEF,
        data: { resetModule: 0 },
      },
    ];

    it.each(smcToPLCTestCases)(
      '$name 빌드 후 파싱하면 원본 데이터와 일치해야 한다',
      ({ def, data }) => {
        const buffer = TelegramBuilder.quickBuild(def, data);

        // 유효성 검증
        const validation = TelegramValidator.validate(buffer, def);
        expect(validation.valid).toBe(true);

        // 파싱
        const parsed = TelegramParser.parse(buffer, def);
        const parsedData = parsed.data as Record<string, number>;

        // 데이터 비교
        for (const [key, value] of Object.entries(data)) {
          expect(parsedData[key]).toBe(value);
        }
      },
    );

    it('SMC → PLC 명령 전문 (100, 110, 120, 130, 140)이 모두 빌드/파싱 가능해야 한다', () => {
      const commands = [
        { def: TELEGRAM_100_DEF, data: { request: 1 } },
        { def: TELEGRAM_110_DEF, data: { inductionNo: 1, request: 1 } },
        { def: TELEGRAM_120_DEF, data: { inductionNo: 1, request: 1 } },
        { def: TELEGRAM_130_DEF, data: { overflowChute1: 90, overflowChute2: 91, maxRecirculation: 3, reason: 0 } },
        { def: TELEGRAM_140_DEF, data: { resetModule: 0 } },
      ];

      for (const { def, data } of commands) {
        const buffer = TelegramBuilder.quickBuild(def, data);
        expect(TelegramValidator.quickValidate(buffer)).toBe(true);

        const parsed = TelegramParser.parse(buffer, def);
        expect(parsed.header.telegramNo).toBe(def.telegramNo);
      }
    });
  });

  // 테스트 3: PLC → SMC 전문 (1~40) 라운드트립
  describe('PLC → SMC 전문 (1~40) 라운드트립', () => {
    const plcToSMCTestCases: Array<{
      name: string;
      def: any;
      data: Record<string, number>;
    }> = [
      {
        name: 'Telegram 1 (HeartBeat)',
        def: TELEGRAM_1_DEF,
        data: { acknowledgeStatus: 0, heartBeatNo: 65535 },
      },
      {
        name: 'Telegram 10 (SorterStatus)',
        def: TELEGRAM_10_DEF,
        data: { sorterStatus: 1 },
      },
      {
        name: 'Telegram 11 (InductionStatus)',
        def: TELEGRAM_11_DEF,
        data: { inductionCount: 2, inductionNo: 1, inductionStatus: 1 },
      },
      {
        name: 'Telegram 12 (InductionMode)',
        def: TELEGRAM_12_DEF,
        data: { inductionCount: 2, inductionNo: 1, inductionMode: 0 },
      },
      {
        name: 'Telegram 21 (ItemDischarged)',
        def: TELEGRAM_21_DEF,
        data: { cellIndex: 10, inductionNo: 1, mode: 0, chuteNumber: 5, recirculationCount: 0 },
      },
      {
        name: 'Telegram 40 (CodeRequest)',
        def: TELEGRAM_40_DEF,
        data: { inductionNo: 1 },
      },
    ];

    it.each(plcToSMCTestCases)(
      '$name 빌드 후 파싱하면 원본 데이터와 일치해야 한다',
      ({ def, data }) => {
        const buffer = TelegramBuilder.quickBuild(def, data);

        const validation = TelegramValidator.validate(buffer, def);
        expect(validation.valid).toBe(true);

        const parsed = TelegramParser.parse(buffer, def);
        const parsedData = parsed.data as Record<string, number>;

        for (const [key, value] of Object.entries(data)) {
          expect(parsedData[key]).toBe(value);
        }
      },
    );

    it('PLC → SMC 전문이 모두 레지스트리에 등록되어 있어야 한다', () => {
      const plcTelegrams = TelegramRegistry.getPLCToSMC();
      expect(plcTelegrams.length).toBeGreaterThanOrEqual(7); // 1, 10, 11, 12, 20, 21, 22, 40

      for (const def of plcTelegrams) {
        expect(def.direction).toBe(TelegramDirection.PLC_TO_SMC);
        expect(TelegramRegistry.get(def.telegramNo)).toBeDefined();
      }
    });
  });

  // 테스트 4: 전문 유효성 검증
  describe('전문 유효성 검증', () => {
    it('올바른 전문은 검증을 통과해야 한다', () => {
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_10_DEF, { sorterStatus: 1 });

      const result = TelegramValidator.validate(buffer);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);

      expect(TelegramValidator.quickValidate(buffer)).toBe(true);
    });

    it('STX가 잘못된 전문은 검증에 실패해야 한다', () => {
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_10_DEF, { sorterStatus: 1 });
      // STX를 임의 값으로 덮어쓴다
      buffer.writeUInt8(0xFF, 0);

      const result = TelegramValidator.validate(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Invalid STX'))).toBe(true);
    });

    it('ETX가 잘못된 전문은 검증에 실패해야 한다', () => {
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_10_DEF, { sorterStatus: 1 });
      // ETX 위치를 찾아서 임의 값으로 덮어쓴다
      const dataLength = buffer.readUInt16BE(10);
      const etxOffset = HEADER_SIZE + dataLength;
      buffer.writeUInt8(0xFF, etxOffset);

      const result = TelegramValidator.validate(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Invalid ETX'))).toBe(true);
    });

    it('버퍼 크기가 부족하면 검증에 실패해야 한다', () => {
      // 최소 크기(13 bytes)보다 작은 버퍼
      const buffer = Buffer.alloc(5);
      buffer.writeUInt8(STX, 0);

      const result = TelegramValidator.validate(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Buffer too short'))).toBe(true);

      expect(TelegramValidator.quickValidate(buffer)).toBe(false);
    });

    it('알 수 없는 전문 번호는 레지스트리에서 조회 실패해야 한다', () => {
      const buffer = TelegramBuilder.quickBuild(TELEGRAM_10_DEF, { sorterStatus: 1 });
      // 전문 번호를 미등록 번호로 변경
      buffer.writeUInt16BE(9999, 8);

      const result = TelegramValidator.validate(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unknown telegram number'))).toBe(true);
    });

    it('모든 등록된 전문 정의에 대해 빌드 → 검증이 성공해야 한다', () => {
      const allDefs = TelegramRegistry.getAll();
      expect(allDefs.length).toBeGreaterThan(0);

      for (const def of allDefs) {
        // 기본값(0)으로 빌드
        const data: Record<string, number> = {};
        for (const field of def.fields) {
          data[field.name] = 0;
        }

        const buffer = TelegramBuilder.quickBuild(def, data);

        const result = TelegramValidator.validate(buffer, def);
        expect(result.valid).toBe(true);
        if (!result.valid) {
          // 디버깅용 출력 (실패 시)
          console.error(`Validation failed for Telegram ${def.telegramNo} (${def.name}):`, result.errors);
        }
      }
    });
  });
});
