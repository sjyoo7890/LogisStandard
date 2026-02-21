import { TelegramDefinition } from './types';
import { PLC_TO_SMC_DEFINITIONS } from './telegrams/plc-to-smc';
import { SMC_TO_PLC_DEFINITIONS } from './telegrams/smc-to-plc';

/**
 * 전문 레지스트리 (팩토리)
 * 전문 번호로 적절한 정의를 반환
 */
export class TelegramRegistry {
  private static definitions: Map<number, TelegramDefinition> = new Map();
  private static initialized = false;

  /**
   * 레지스트리 초기화 (모든 전문 정의 등록)
   */
  private static init(): void {
    if (this.initialized) return;

    for (const def of PLC_TO_SMC_DEFINITIONS) {
      this.definitions.set(def.telegramNo, def);
    }
    for (const def of SMC_TO_PLC_DEFINITIONS) {
      this.definitions.set(def.telegramNo, def);
    }

    this.initialized = true;
  }

  /**
   * 전문 번호로 정의 조회
   */
  static get(telegramNo: number): TelegramDefinition | undefined {
    this.init();
    return this.definitions.get(telegramNo);
  }

  /**
   * 전문 번호로 정의 조회 (없으면 에러)
   */
  static getOrThrow(telegramNo: number): TelegramDefinition {
    const def = this.get(telegramNo);
    if (!def) {
      throw new Error(`Unknown telegram number: ${telegramNo}`);
    }
    return def;
  }

  /**
   * 모든 전문 정의 목록
   */
  static getAll(): TelegramDefinition[] {
    this.init();
    return Array.from(this.definitions.values());
  }

  /**
   * PLC → SMC 전문 정의만
   */
  static getPLCToSMC(): TelegramDefinition[] {
    return PLC_TO_SMC_DEFINITIONS;
  }

  /**
   * SMC → PLC 전문 정의만
   */
  static getSMCToPLC(): TelegramDefinition[] {
    return SMC_TO_PLC_DEFINITIONS;
  }

  /**
   * 커스텀 전문 정의 등록
   */
  static register(definition: TelegramDefinition): void {
    this.init();
    this.definitions.set(definition.telegramNo, definition);
  }
}
