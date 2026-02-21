import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type PlanStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface SortingRule {
  id: string;
  planId: string;
  priority: number;
  zipCodePattern: string;
  destinationChute: number;
  destination: string;
  description: string;
}

export interface SortingPlan {
  id: string;
  name: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  rules: SortingRule[];
}

export interface SpecialKeyPlan {
  id: string;
  keyCode: string;
  destination: string;
  chuteNumber: number;
  description: string;
}

export interface SortEvent {
  id: string;
  barcode: string;
  zipCode: string;
  matchedRuleId?: string;
  assignedChute: number;
  destination: string;
  result: 'SUCCESS' | 'REJECT' | 'RECHECK';
  processedAt: string;
  inductionId: string;
}

export interface CommLogEntry {
  id: string;
  direction: 'SEND' | 'RECEIVE';
  target: string;
  messageType: string;
  payload: string;
  timestamp: string;
  success: boolean;
}

@Injectable()
export class SortingService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'sorting' });
  private plans = new Map<string, SortingPlan>();
  private specialKeys: SpecialKeyPlan[] = [];
  private sortHistory: SortEvent[] = [];
  private commLog: CommLogEntry[] = [];
  private sortEventListeners: Array<(event: SortEvent) => void> = [];
  private commLogListeners: Array<(entry: CommLogEntry) => void> = [];
  private processedCount = 0;
  private successCount = 0;
  private rejectCount = 0;

  private static readonly MAX_HISTORY = 1000;
  private static readonly MAX_COMM_LOG = 500;

  onModuleInit() {
    this.initializePlans();
    this.initializeSpecialKeys();
    this.logger.info('SortingService initialized with 2 plans');
  }

  onModuleDestroy() {
    this.logger.info('SortingService destroyed');
  }

  private initializePlans(): void {
    // ACTIVE 계획
    const activePlan: SortingPlan = {
      id: 'PLAN-001',
      name: '일반우편 구분계획 A',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: this.generateRules('PLAN-001'),
    };
    this.plans.set(activePlan.id, activePlan);

    // DRAFT 계획
    const draftPlan: SortingPlan = {
      id: 'PLAN-002',
      name: '등기우편 구분계획 B',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: this.generateRules('PLAN-002'),
    };
    this.plans.set(draftPlan.id, draftPlan);
  }

  private generateRules(planId: string): SortingRule[] {
    const destinations = [
      { zip: '01*', dest: '서울강북', chute: 1 },
      { zip: '02*', dest: '서울강남', chute: 2 },
      { zip: '03*', dest: '서울서부', chute: 3 },
      { zip: '04*', dest: '서울동부', chute: 4 },
      { zip: '05*', dest: '경기북부', chute: 5 },
      { zip: '06*', dest: '경기남부', chute: 6 },
      { zip: '1*', dest: '경기광역', chute: 7 },
      { zip: '2*', dest: '인천/강원', chute: 8 },
      { zip: '3*', dest: '충청권', chute: 9 },
      { zip: '4*', dest: '전라/경상', chute: 10 },
    ];
    return destinations.map((d, i) => ({
      id: `${planId}-R${String(i + 1).padStart(3, '0')}`,
      planId,
      priority: i + 1,
      zipCodePattern: d.zip,
      destinationChute: d.chute,
      destination: d.dest,
      description: `${d.dest} 지역 구분규칙`,
    }));
  }

  private initializeSpecialKeys(): void {
    this.specialKeys = [
      { id: 'SK-001', keyCode: 'SP01', destination: '반송', chuteNumber: 19, description: '반송우편 처리' },
      { id: 'SK-002', keyCode: 'SP02', destination: '미구분', chuteNumber: 20, description: '미구분우편 처리' },
      { id: 'SK-003', keyCode: 'SP03', destination: '특수', chuteNumber: 18, description: '특수우편 처리' },
    ];
  }

  // ============================
  // 구분계획 CRUD
  // ============================

  getAllPlans(): SortingPlan[] {
    return Array.from(this.plans.values());
  }

  getPlan(planId: string): SortingPlan | undefined {
    return this.plans.get(planId);
  }

  getActivePlan(): SortingPlan | undefined {
    return Array.from(this.plans.values()).find((p) => p.status === 'ACTIVE');
  }

  createPlan(name: string): SortingPlan {
    const plan: SortingPlan = {
      id: `PLAN-${Date.now()}`,
      name,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [],
    };
    this.plans.set(plan.id, plan);
    return plan;
  }

  activatePlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;
    // 기존 ACTIVE를 ARCHIVED로
    for (const p of this.plans.values()) {
      if (p.status === 'ACTIVE') p.status = 'ARCHIVED';
    }
    plan.status = 'ACTIVE';
    plan.updatedAt = new Date().toISOString();
    this.logger.info(`Plan ${planId} activated`);
    return true;
  }

  getRulesForPlan(planId: string): SortingRule[] {
    return this.plans.get(planId)?.rules || [];
  }

  getSpecialKeys(): SpecialKeyPlan[] {
    return [...this.specialKeys];
  }

  // ============================
  // 구분 로직 엔진
  // ============================

  processBarcode(barcode: string, inductionId = 'IND-01'): SortEvent {
    this.processedCount++;
    const zipCode = this.extractZipCode(barcode);
    const activePlan = this.getActivePlan();

    let matchedRule: SortingRule | undefined;
    let assignedChute = 20; // 기본: 미구분 슈트
    let destination = '미구분';
    let result: SortEvent['result'] = 'REJECT';

    if (activePlan && zipCode) {
      matchedRule = this.matchRule(zipCode, activePlan.rules);
      if (matchedRule) {
        assignedChute = matchedRule.destinationChute;
        destination = matchedRule.destination;
        result = 'SUCCESS';
        this.successCount++;
      } else {
        this.rejectCount++;
      }
    } else {
      this.rejectCount++;
    }

    const event: SortEvent = {
      id: `SE-${Date.now()}-${this.processedCount}`,
      barcode,
      zipCode: zipCode || 'UNKNOWN',
      matchedRuleId: matchedRule?.id,
      assignedChute,
      destination,
      result,
      processedAt: new Date().toISOString(),
      inductionId,
    };

    this.recordSortEvent(event);
    this.simulatePlcSend(event);
    return event;
  }

  private extractZipCode(barcode: string): string | null {
    // 바코드에서 우편번호 추출 시뮬레이션
    // 바코드 형식: 42XXXXX... → XXXXX가 우편번호
    if (barcode.length >= 7 && barcode.startsWith('42')) {
      return barcode.substring(2, 7);
    }
    // 5자리 숫자 바코드 → 직접 우편번호
    if (/^\d{5,}$/.test(barcode)) {
      return barcode.substring(0, 5);
    }
    return null;
  }

  private matchRule(zipCode: string, rules: SortingRule[]): SortingRule | undefined {
    // 우선순위 순 매칭
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    for (const rule of sorted) {
      if (this.matchPattern(zipCode, rule.zipCodePattern)) {
        return rule;
      }
    }
    return undefined;
  }

  private matchPattern(zipCode: string, pattern: string): boolean {
    // 패턴 매칭: 01* → 01로 시작, 1* → 1로 시작
    const prefix = pattern.replace('*', '');
    return zipCode.startsWith(prefix);
  }

  private recordSortEvent(event: SortEvent): void {
    this.sortHistory.unshift(event);
    if (this.sortHistory.length > SortingService.MAX_HISTORY) {
      this.sortHistory = this.sortHistory.slice(0, SortingService.MAX_HISTORY);
    }
    for (const listener of this.sortEventListeners) {
      listener(event);
    }
  }

  private simulatePlcSend(event: SortEvent): void {
    const entry: CommLogEntry = {
      id: `CL-${Date.now()}`,
      direction: 'SEND',
      target: `PLC-CHUTE-${event.assignedChute}`,
      messageType: 'SORT_COMMAND',
      payload: JSON.stringify({ chute: event.assignedChute, barcode: event.barcode }),
      timestamp: new Date().toISOString(),
      success: true,
    };
    this.commLog.unshift(entry);
    if (this.commLog.length > SortingService.MAX_COMM_LOG) {
      this.commLog = this.commLog.slice(0, SortingService.MAX_COMM_LOG);
    }
    for (const listener of this.commLogListeners) {
      listener(entry);
    }
  }

  // ============================
  // 조회
  // ============================

  getSortHistory(limit = 50): SortEvent[] {
    return this.sortHistory.slice(0, limit);
  }

  getCommLog(limit = 50): CommLogEntry[] {
    return this.commLog.slice(0, limit);
  }

  getStats() {
    return {
      totalProcessed: this.processedCount,
      successCount: this.successCount,
      rejectCount: this.rejectCount,
      successRate: this.processedCount > 0
        ? Math.round((this.successCount / this.processedCount) * 10000) / 100
        : 0,
      activePlan: this.getActivePlan()?.name || null,
    };
  }

  getStatus() {
    return {
      plans: this.plans.size,
      activePlan: this.getActivePlan()?.id || null,
      totalRules: Array.from(this.plans.values()).reduce((sum, p) => sum + p.rules.length, 0),
      specialKeys: this.specialKeys.length,
      stats: this.getStats(),
    };
  }

  // ============================
  // 이벤트 리스너
  // ============================

  onSortEvent(listener: (event: SortEvent) => void): void {
    this.sortEventListeners.push(listener);
  }

  onCommLog(listener: (entry: CommLogEntry) => void): void {
    this.commLogListeners.push(listener);
  }
}
