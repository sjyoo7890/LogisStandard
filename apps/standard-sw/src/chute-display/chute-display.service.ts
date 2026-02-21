import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type DisplayChuteStatus = 'NORMAL' | 'NEAR_FULL' | 'FULL' | 'EMPTY' | 'DISABLED';

export interface ChuteDisplayEntry {
  chuteNumber: number;
  destination: string;
  currentCount: number;
  capacity: number;
  fillRate: number;
  status: DisplayChuteStatus;
  lastUpdated: string;
}

export interface DisplayPlanMapping {
  chuteNumber: number;
  destination: string;
}

@Injectable()
export class ChuteDisplayService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'chute-display' });
  private displays = new Map<number, ChuteDisplayEntry>();
  private displayListeners: Array<(entry: ChuteDisplayEntry) => void> = [];

  private static readonly CHUTE_COUNT = 20;
  private static readonly DEFAULT_CAPACITY = 200;
  private static readonly NEAR_FULL_THRESHOLD = 0.8;
  private static readonly FULL_THRESHOLD = 1.0;

  private static readonly DEFAULT_DESTINATIONS = [
    '서울강북', '서울강남', '서울서부', '서울동부', '경기북부',
    '경기남부', '경기광역', '인천/강원', '충청권', '전라/경상',
    '세종', '제주', '울산', '대구', '광주',
    '대전', '부산', '특수', '반송', '미구분',
  ];

  onModuleInit() {
    this.initializeDisplays();
    this.logger.info('ChuteDisplayService initialized with 20 chutes');
  }

  onModuleDestroy() {
    this.logger.info('ChuteDisplayService destroyed');
  }

  private initializeDisplays(): void {
    for (let i = 1; i <= ChuteDisplayService.CHUTE_COUNT; i++) {
      const count = Math.floor(Math.random() * 160);
      this.displays.set(i, {
        chuteNumber: i,
        destination: ChuteDisplayService.DEFAULT_DESTINATIONS[i - 1],
        currentCount: count,
        capacity: ChuteDisplayService.DEFAULT_CAPACITY,
        fillRate: Math.round((count / ChuteDisplayService.DEFAULT_CAPACITY) * 100),
        status: this.calcStatus(count, ChuteDisplayService.DEFAULT_CAPACITY),
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  private calcStatus(count: number, capacity: number): DisplayChuteStatus {
    const rate = count / capacity;
    if (rate >= ChuteDisplayService.FULL_THRESHOLD) return 'FULL';
    if (rate >= ChuteDisplayService.NEAR_FULL_THRESHOLD) return 'NEAR_FULL';
    if (count === 0) return 'EMPTY';
    return 'NORMAL';
  }

  // ============================
  // 슈트 현황 조회
  // ============================

  getAllDisplays(): ChuteDisplayEntry[] {
    return Array.from(this.displays.values());
  }

  getDisplay(chuteNumber: number): ChuteDisplayEntry | undefined {
    return this.displays.get(chuteNumber);
  }

  // ============================
  // 구분계획 일괄 적용
  // ============================

  applyPlan(mappings: DisplayPlanMapping[]): { applied: number; total: number } {
    let applied = 0;
    for (const mapping of mappings) {
      const display = this.displays.get(mapping.chuteNumber);
      if (display) {
        display.destination = mapping.destination;
        display.currentCount = 0;
        display.fillRate = 0;
        display.status = 'EMPTY';
        display.lastUpdated = new Date().toISOString();
        applied++;
        for (const listener of this.displayListeners) {
          listener(display);
        }
      }
    }
    this.logger.info(`Plan applied: ${applied}/${mappings.length} chutes updated`);
    return { applied, total: mappings.length };
  }

  // ============================
  // 개수 업데이트 (구분 처리 시 호출)
  // ============================

  incrementCount(chuteNumber: number): ChuteDisplayEntry | undefined {
    const display = this.displays.get(chuteNumber);
    if (!display) return undefined;

    display.currentCount++;
    display.fillRate = Math.round((display.currentCount / display.capacity) * 100);
    display.status = this.calcStatus(display.currentCount, display.capacity);
    display.lastUpdated = new Date().toISOString();

    for (const listener of this.displayListeners) {
      listener(display);
    }
    return display;
  }

  resetChute(chuteNumber: number): boolean {
    const display = this.displays.get(chuteNumber);
    if (!display) return false;

    display.currentCount = 0;
    display.fillRate = 0;
    display.status = 'EMPTY';
    display.lastUpdated = new Date().toISOString();

    for (const listener of this.displayListeners) {
      listener(display);
    }
    return true;
  }

  // ============================
  // 요약
  // ============================

  getSummary() {
    const all = this.getAllDisplays();
    return {
      totalChutes: all.length,
      normal: all.filter((d) => d.status === 'NORMAL').length,
      nearFull: all.filter((d) => d.status === 'NEAR_FULL').length,
      full: all.filter((d) => d.status === 'FULL').length,
      empty: all.filter((d) => d.status === 'EMPTY').length,
      disabled: all.filter((d) => d.status === 'DISABLED').length,
      totalItems: all.reduce((sum, d) => sum + d.currentCount, 0),
    };
  }

  getStatus() {
    return this.getSummary();
  }

  // ============================
  // 이벤트 리스너
  // ============================

  onDisplayChange(listener: (entry: ChuteDisplayEntry) => void): void {
    this.displayListeners.push(listener);
  }
}
