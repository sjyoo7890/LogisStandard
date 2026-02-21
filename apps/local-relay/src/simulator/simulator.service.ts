import { Injectable } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type SortingRule = 'ODD_EVEN' | 'DIVISIBLE' | 'RANGE' | 'MODULO';

export interface SortingRuleConfig {
  rule: SortingRule;
  description: string;
  params: Record<string, number>;
}

export interface SimulatedItem {
  pid: number;
  barcode: string;
  inductionNo: number;
  sortCode: string;
  assignedChute: number;
  rule: SortingRule;
  result: 'SUCCESS' | 'REJECT' | 'NO_READ';
  timestamp: string;
}

export interface SimulatorStats {
  running: boolean;
  totalItems: number;
  successCount: number;
  rejectCount: number;
  noReadCount: number;
  startedAt?: string;
  itemsPerMinute: number;
}

/**
 * 시뮬레이터 서비스
 * - H/W 장비 연결 없이 표준 인터페이스 검증용
 * - 가상 PLC 에뮬레이션 (모든 Telegram 응답 시뮬레이션)
 * - 홀수/짝수/나눗셈 등의 구분규칙으로 실물 구분 테스트
 * - 기준값과 실제값 비교 검증
 */
@Injectable()
export class SimulatorService {
  private logger = createLogger({ service: 'simulator' });
  private running = false;
  private simulationInterval?: NodeJS.Timeout;
  private items: SimulatedItem[] = [];
  private pidCounter = 100000;
  private startedAt?: string;
  private itemRate = 0;

  private sortingRules: SortingRuleConfig[] = [
    { rule: 'ODD_EVEN', description: '홀수 → 슈트1, 짝수 → 슈트2', params: { oddChute: 1, evenChute: 2 } },
    { rule: 'DIVISIBLE', description: '3의 배수 → 슈트3', params: { divisor: 3, chute: 3 } },
    { rule: 'RANGE', description: '우편번호 30000~39999 → 슈트15 (대전)', params: { min: 30000, max: 39999, chute: 15 } },
    { rule: 'MODULO', description: 'PID % 10 → 해당 슈트', params: { modulo: 10 } },
  ];

  private activeRule: SortingRuleConfig = this.sortingRules[0];

  /**
   * 시뮬레이션 시작
   */
  start(intervalMs = 500): boolean {
    if (this.running) return false;
    this.running = true;
    this.startedAt = new Date().toISOString();
    this.simulationInterval = setInterval(() => this.generateItem(), intervalMs);
    this.logger.info(`Simulator started (interval: ${intervalMs}ms, rule: ${this.activeRule.rule})`);
    return true;
  }

  /**
   * 시뮬레이션 정지
   */
  stop(): boolean {
    if (!this.running) return false;
    this.running = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
    this.logger.info('Simulator stopped');
    return true;
  }

  /**
   * 구분 규칙 설정
   */
  setRule(rule: SortingRule): boolean {
    const found = this.sortingRules.find((r) => r.rule === rule);
    if (!found) return false;
    this.activeRule = found;
    this.logger.info(`Sorting rule set to: ${rule}`);
    return true;
  }

  /**
   * 가상 소포 생성 및 구분
   */
  private generateItem(): void {
    const pid = ++this.pidCounter;
    const barcode = Math.random() > 0.1 ? `${42 + Math.floor(Math.random() * 58)}${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}` : '';
    const inductionNo = (pid % 4) + 1;
    const sortCode = barcode ? barcode.substring(0, 5) : '';

    let assignedChute = 99; // default reject
    let result: 'SUCCESS' | 'REJECT' | 'NO_READ' = 'REJECT';

    if (!barcode) {
      result = 'NO_READ';
      assignedChute = 0;
    } else {
      const code = parseInt(sortCode, 10);
      switch (this.activeRule.rule) {
        case 'ODD_EVEN':
          assignedChute = code % 2 === 1 ? this.activeRule.params.oddChute : this.activeRule.params.evenChute;
          result = 'SUCCESS';
          break;
        case 'DIVISIBLE':
          if (code % this.activeRule.params.divisor === 0) {
            assignedChute = this.activeRule.params.chute;
            result = 'SUCCESS';
          }
          break;
        case 'RANGE':
          if (code >= this.activeRule.params.min && code <= this.activeRule.params.max) {
            assignedChute = this.activeRule.params.chute;
            result = 'SUCCESS';
          }
          break;
        case 'MODULO':
          assignedChute = (pid % this.activeRule.params.modulo) + 1;
          result = 'SUCCESS';
          break;
      }
    }

    const item: SimulatedItem = {
      pid,
      barcode,
      inductionNo,
      sortCode,
      assignedChute,
      rule: this.activeRule.rule,
      result,
      timestamp: new Date().toISOString(),
    };

    this.items.unshift(item);
    if (this.items.length > 1000) this.items = this.items.slice(0, 1000);
  }

  /**
   * 단건 수동 시뮬레이션
   */
  simulateOne(barcode: string, sortCode?: string): SimulatedItem {
    const pid = ++this.pidCounter;
    const code = sortCode || (barcode ? barcode.substring(0, 5) : '');
    let assignedChute = 99;
    let result: 'SUCCESS' | 'REJECT' | 'NO_READ' = 'REJECT';

    if (!barcode) {
      result = 'NO_READ';
      assignedChute = 0;
    } else {
      const numCode = parseInt(code, 10);
      if (this.activeRule.rule === 'ODD_EVEN') {
        assignedChute = numCode % 2 === 1 ? this.activeRule.params.oddChute : this.activeRule.params.evenChute;
        result = 'SUCCESS';
      } else if (this.activeRule.rule === 'MODULO') {
        assignedChute = (pid % this.activeRule.params.modulo) + 1;
        result = 'SUCCESS';
      }
    }

    const item: SimulatedItem = {
      pid,
      barcode,
      inductionNo: (pid % 4) + 1,
      sortCode: code,
      assignedChute,
      rule: this.activeRule.rule,
      result,
      timestamp: new Date().toISOString(),
    };
    this.items.unshift(item);
    return item;
  }

  isRunning(): boolean {
    return this.running;
  }

  getItems(limit = 50): SimulatedItem[] {
    return this.items.slice(0, limit);
  }

  getRules(): SortingRuleConfig[] {
    return this.sortingRules;
  }

  getActiveRule(): SortingRuleConfig {
    return this.activeRule;
  }

  getStats(): SimulatorStats {
    return {
      running: this.running,
      totalItems: this.items.length,
      successCount: this.items.filter((i) => i.result === 'SUCCESS').length,
      rejectCount: this.items.filter((i) => i.result === 'REJECT').length,
      noReadCount: this.items.filter((i) => i.result === 'NO_READ').length,
      startedAt: this.startedAt,
      itemsPerMinute: this.itemRate,
    };
  }

  /**
   * 기준값 대비 실제값 비교 검증
   */
  verify(expectedChute: number, actualChute: number, barcode: string): {
    match: boolean;
    barcode: string;
    expected: number;
    actual: number;
  } {
    return {
      match: expectedChute === actualChute,
      barcode,
      expected: expectedChute,
      actual: actualChute,
    };
  }

  reset(): void {
    this.stop();
    this.items = [];
    this.pidCounter = 100000;
    this.startedAt = undefined;
    this.logger.info('Simulator reset');
  }
}
