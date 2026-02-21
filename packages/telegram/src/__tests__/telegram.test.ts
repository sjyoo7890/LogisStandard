import { TelegramBuilder } from '../builder';
import { TelegramParser } from '../parser';
import { TelegramValidator } from '../validator';
import { TelegramRegistry } from '../factory';
import { PIDGenerator } from '../pid';
import { getChannelForTelegram, CHANNELS } from '../ports';
import {
  TELEGRAM_1_DEF, HeartBeatData,
  TELEGRAM_10_DEF,
  TELEGRAM_20_DEF, ItemInductedData,
  TELEGRAM_21_DEF, ItemDischargedData,
  TELEGRAM_22_DEF,
  TELEGRAM_40_DEF,
} from '../telegrams/plc-to-smc';
import {
  TELEGRAM_30_DEF, DestinationRequestData,
  TELEGRAM_100_DEF,
  TELEGRAM_110_DEF,
  TELEGRAM_130_DEF,
  TELEGRAM_140_DEF,
} from '../telegrams/smc-to-plc';
import { STX, ETX, HEADER_SIZE } from '../types';

describe('TelegramBuilder + TelegramParser Round-trip', () => {
  const builder = new TelegramBuilder().setModuleId('PSM00');

  test('Telegram 1 (HeartBeat) round-trip', () => {
    const data = { acknowledgeStatus: 1, heartBeatNo: 42 };
    const buffer = builder.build(TELEGRAM_1_DEF, data);
    const parsed = TelegramParser.parse<HeartBeatData>(buffer, TELEGRAM_1_DEF);

    expect(parsed.header.stx).toBe(STX);
    expect(parsed.header.telegramNo).toBe(1);
    expect(parsed.data.acknowledgeStatus).toBe(1);
    expect(parsed.data.heartBeatNo).toBe(42);
    expect(parsed.etx).toBe(ETX);
  });

  test('Telegram 10 (SorterStatus) round-trip', () => {
    const data = { sorterStatus: 1 };
    const buffer = builder.build(TELEGRAM_10_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_10_DEF);

    expect(parsed.data.sorterStatus).toBe(1);
  });

  test('Telegram 20 (ItemInducted) round-trip with all destinations', () => {
    const data = {
      cellIndex: 150, inductionNo: 1, mode: 0, pid: 100001, cartNumber: 5,
      destination1: 15, destination2: 20, destination3: 0, destination4: 0,
      destination5: 0, destination6: 0, destination7: 0, destination8: 99,
    };
    const buffer = builder.build(TELEGRAM_20_DEF, data);
    const parsed = TelegramParser.parse<ItemInductedData>(buffer, TELEGRAM_20_DEF);

    expect(parsed.data.cellIndex).toBe(150);
    expect(parsed.data.inductionNo).toBe(1);
    expect(parsed.data.pid).toBe(100001);
    expect(parsed.data.destination1).toBe(15);
    expect(parsed.data.destination8).toBe(99);
  });

  test('Telegram 21 (ItemDischarged) round-trip', () => {
    const data = { cellIndex: 150, inductionNo: 1, mode: 0, chuteNumber: 15, recirculationCount: 0 };
    const buffer = builder.build(TELEGRAM_21_DEF, data);
    const parsed = TelegramParser.parse<ItemDischargedData>(buffer, TELEGRAM_21_DEF);

    expect(parsed.data.chuteNumber).toBe(15);
    expect(parsed.data.recirculationCount).toBe(0);
  });

  test('Telegram 22 (ItemSortedConfirm) round-trip', () => {
    const data = { cellIndex: 150, mode: 0, chuteNumber: 15, recirculationCount: 2, status: 1 };
    const buffer = builder.build(TELEGRAM_22_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_22_DEF);

    expect(parsed.data.status).toBe(1);
    expect(parsed.data.recirculationCount).toBe(2);
  });

  test('Telegram 30 (DestinationRequest) round-trip', () => {
    const data = {
      inductionNo: 2, pid: 200005,
      destination1: 10, destination2: 20, destination3: 30, destination4: 0,
      destination5: 0, destination6: 0, destination7: 0, destination8: 0,
    };
    const buffer = builder.build(TELEGRAM_30_DEF, data);
    const parsed = TelegramParser.parse<DestinationRequestData>(buffer, TELEGRAM_30_DEF);

    expect(parsed.data.inductionNo).toBe(2);
    expect(parsed.data.pid).toBe(200005);
    expect(parsed.data.destination1).toBe(10);
  });

  test('Telegram 100 (SetControlSorter) round-trip', () => {
    const data = { request: 1 };
    const buffer = builder.build(TELEGRAM_100_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_100_DEF);

    expect(parsed.data.request).toBe(1);
  });

  test('Telegram 110 (SetControlInduction) round-trip', () => {
    const data = { inductionNo: 3, request: 0 };
    const buffer = builder.build(TELEGRAM_110_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_110_DEF);

    expect(parsed.data.inductionNo).toBe(3);
    expect(parsed.data.request).toBe(0);
  });

  test('Telegram 130 (SetOverflowConfiguration) round-trip', () => {
    const data = { overflowChute1: 98, overflowChute2: 99, maxRecirculation: 3, reason: 0 };
    const buffer = builder.build(TELEGRAM_130_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_130_DEF);

    expect(parsed.data.overflowChute1).toBe(98);
    expect(parsed.data.maxRecirculation).toBe(3);
  });

  test('Telegram 140 (SetResetRequest) round-trip', () => {
    const data = { resetModule: 1 };
    const buffer = builder.build(TELEGRAM_140_DEF, data);
    const parsed = TelegramParser.parse(buffer, TELEGRAM_140_DEF);

    expect(parsed.data.resetModule).toBe(1);
  });
});

describe('TelegramParser.autoParse', () => {
  test('auto-parses based on telegram number in header', () => {
    const buffer = TelegramBuilder.quickBuild(TELEGRAM_40_DEF, { inductionNo: 2 });
    const parsed = TelegramParser.autoParse(buffer);

    expect(parsed.header.telegramNo).toBe(40);
    expect(parsed.data.inductionNo).toBe(2);
  });
});

describe('TelegramValidator', () => {
  const builder = new TelegramBuilder().setModuleId('PSM00');

  test('valid telegram passes validation', () => {
    const buffer = builder.build(TELEGRAM_1_DEF, { acknowledgeStatus: 1, heartBeatNo: 1 });
    const result = TelegramValidator.validate(buffer, TELEGRAM_1_DEF);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('quickValidate returns true for valid buffer', () => {
    const buffer = builder.build(TELEGRAM_10_DEF, { sorterStatus: 1 });
    expect(TelegramValidator.quickValidate(buffer)).toBe(true);
  });

  test('rejects buffer with invalid STX', () => {
    const buffer = builder.build(TELEGRAM_1_DEF, { acknowledgeStatus: 0, heartBeatNo: 0 });
    buffer.writeUInt8(0xFF, 0);  // corrupt STX
    const result = TelegramValidator.validate(buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('STX'))).toBe(true);
  });

  test('rejects buffer with invalid ETX', () => {
    const buffer = builder.build(TELEGRAM_1_DEF, { acknowledgeStatus: 0, heartBeatNo: 0 });
    const etxOffset = HEADER_SIZE + buffer.readUInt16BE(10);
    buffer.writeUInt8(0xFF, etxOffset);  // corrupt ETX
    const result = TelegramValidator.validate(buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('ETX'))).toBe(true);
  });

  test('rejects buffer too short', () => {
    const buffer = Buffer.alloc(5);
    const result = TelegramValidator.validate(buffer);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('too short'))).toBe(true);
  });
});

describe('TelegramRegistry', () => {
  test('returns definition for known telegram', () => {
    const def = TelegramRegistry.get(20);
    expect(def).toBeDefined();
    expect(def!.name).toBe('ItemInducted');
  });

  test('returns undefined for unknown telegram', () => {
    expect(TelegramRegistry.get(999)).toBeUndefined();
  });

  test('getOrThrow throws for unknown telegram', () => {
    expect(() => TelegramRegistry.getOrThrow(999)).toThrow('Unknown telegram number: 999');
  });

  test('lists all 20 telegrams', () => {
    const all = TelegramRegistry.getAll();
    expect(all.length).toBe(20); // 8 PLC→SMC + 12 SMC→PLC
  });

  test('PLC→SMC has 8 definitions', () => {
    expect(TelegramRegistry.getPLCToSMC().length).toBe(8);
  });

  test('SMC→PLC has 12 definitions', () => {
    expect(TelegramRegistry.getSMCToPLC().length).toBe(12);
  });
});

describe('PIDGenerator', () => {
  test('generates auto PIDs in range for induction 1', () => {
    const gen = new PIDGenerator();
    const pid1 = gen.generate(1, 'auto');
    const pid2 = gen.generate(1, 'auto');

    expect(pid1).toBe(100001);
    expect(pid2).toBe(100002);
  });

  test('generates key PIDs in range for induction 2', () => {
    const gen = new PIDGenerator();
    const pid = gen.generate(2, 'key');

    expect(pid).toBe(215001);
  });

  test('wraps around when exceeding range', () => {
    const gen = new PIDGenerator();
    // Force counter near end
    for (let i = 0; i < 14999; i++) gen.generate(1, 'auto');
    const last = gen.generate(1, 'auto');
    expect(last).toBe(115000); // last in range

    const wrapped = gen.generate(1, 'auto');
    expect(wrapped).toBe(100001); // wrapped
  });

  test('resolve returns correct induction and mode', () => {
    expect(PIDGenerator.resolve(100001)).toEqual({ inductionNo: 1, mode: 'auto' });
    expect(PIDGenerator.resolve(115001)).toEqual({ inductionNo: 1, mode: 'key' });
    expect(PIDGenerator.resolve(300500)).toEqual({ inductionNo: 3, mode: 'auto' });
    expect(PIDGenerator.resolve(999999)).toBeNull();
  });

  test('reset clears counters', () => {
    const gen = new PIDGenerator();
    gen.generate(1, 'auto');
    gen.reset(1);
    expect(gen.getCurrent(1, 'auto')).toBeUndefined();
  });

  test('throws for invalid induction number', () => {
    const gen = new PIDGenerator();
    expect(() => gen.generate(5, 'auto')).toThrow('Invalid induction number: 5');
  });
});

describe('Port Configuration', () => {
  test('getChannelForTelegram returns correct channels', () => {
    expect(getChannelForTelegram(1)!.port).toBe(3001);   // Heartbeat
    expect(getChannelForTelegram(20)!.port).toBe(3006);   // Induct
    expect(getChannelForTelegram(21)!.port).toBe(3000);   // Discharge
    expect(getChannelForTelegram(22)!.port).toBe(3004);   // Confirm
    expect(getChannelForTelegram(30)!.port).toBe(3003);   // Destination
    expect(getChannelForTelegram(100)!.port).toBe(3011);  // MCS
  });

  test('returns null for unknown telegram', () => {
    expect(getChannelForTelegram(999)).toBeNull();
  });

  test('all channels have valid port numbers', () => {
    Object.values(CHANNELS).forEach(ch => {
      expect(ch.port).toBeGreaterThan(0);
      expect(ch.port).toBeLessThan(65536);
    });
  });
});
