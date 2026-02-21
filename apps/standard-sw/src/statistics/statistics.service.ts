import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface DailyStats {
  date: string;
  totalProcessed: number;
  successCount: number;
  rejectCount: number;
  recheckCount: number;
  successRate: number;
}

export interface InductionStats {
  inductionId: string;
  date: string;
  totalProcessed: number;
  successCount: number;
  rejectCount: number;
  avgProcessingTime: number;
}

export interface ChuteStats {
  chuteNumber: number;
  date: string;
  totalItems: number;
  destination: string;
  fullCount: number;
  nearFullCount: number;
}

export interface CodeStats {
  zipCodePrefix: string;
  date: string;
  count: number;
  destination: string;
}

export interface SorterStats {
  sorterId: string;
  date: string;
  totalProcessed: number;
  uptime: number;
  errorCount: number;
}

export interface DestinationStats {
  destination: string;
  date: string;
  totalItems: number;
  chuteNumbers: number[];
}

@Injectable()
export class StatisticsService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'statistics' });
  private dailyStats: DailyStats[] = [];
  private inductionStats: InductionStats[] = [];
  private chuteStats: ChuteStats[] = [];
  private codeStats: CodeStats[] = [];
  private sorterStats: SorterStats[] = [];
  private destinationStats: DestinationStats[] = [];

  onModuleInit() {
    this.initializeDemoData();
    this.logger.info('StatisticsService initialized with 3-day demo data');
  }

  onModuleDestroy() {
    this.logger.info('StatisticsService destroyed');
  }

  private initializeDemoData(): void {
    const now = new Date();
    for (let d = 0; d < 3; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];

      const baseCount = 5000 - d * 800;

      // 일일 요약
      this.dailyStats.push({
        date: dateStr,
        totalProcessed: baseCount,
        successCount: Math.round(baseCount * 0.92),
        rejectCount: Math.round(baseCount * 0.05),
        recheckCount: Math.round(baseCount * 0.03),
        successRate: 92.0,
      });

      // 인덕션별
      for (let i = 1; i <= 2; i++) {
        this.inductionStats.push({
          inductionId: `IND-${String(i).padStart(2, '0')}`,
          date: dateStr,
          totalProcessed: Math.round(baseCount / 2),
          successCount: Math.round((baseCount / 2) * 0.92),
          rejectCount: Math.round((baseCount / 2) * 0.05),
          avgProcessingTime: 120 + Math.round(Math.random() * 30),
        });
      }

      // 슈트별
      const destinations = ['서울강북', '서울강남', '서울서부', '서울동부', '경기북부',
        '경기남부', '경기광역', '인천/강원', '충청권', '전라/경상',
        '세종', '제주', '울산', '대구', '광주',
        '대전', '부산', '특수-1', '반송', '미구분'];
      for (let c = 1; c <= 20; c++) {
        this.chuteStats.push({
          chuteNumber: c,
          date: dateStr,
          totalItems: Math.round(baseCount / 20) + Math.round(Math.random() * 50),
          destination: destinations[c - 1],
          fullCount: Math.floor(Math.random() * 5),
          nearFullCount: Math.floor(Math.random() * 10),
        });
      }

      // 코드별
      const codePrefixes = ['01', '02', '03', '04', '05', '06', '10', '20', '30', '40'];
      for (const prefix of codePrefixes) {
        this.codeStats.push({
          zipCodePrefix: prefix,
          date: dateStr,
          count: Math.round(baseCount / 10) + Math.round(Math.random() * 100),
          destination: destinations[codePrefixes.indexOf(prefix)],
        });
      }

      // 구분기별
      for (let s = 1; s <= 2; s++) {
        this.sorterStats.push({
          sorterId: `SORTER-${String(s).padStart(2, '0')}`,
          date: dateStr,
          totalProcessed: Math.round(baseCount / 2),
          uptime: 95 + Math.round(Math.random() * 5),
          errorCount: Math.floor(Math.random() * 10),
        });
      }

      // 행선지별
      const destNames = ['서울강북', '서울강남', '경기북부', '경기남부', '충청권'];
      for (const dest of destNames) {
        this.destinationStats.push({
          destination: dest,
          date: dateStr,
          totalItems: Math.round(baseCount / 5) + Math.round(Math.random() * 200),
          chuteNumbers: [destNames.indexOf(dest) + 1],
        });
      }
    }
  }

  // ============================
  // 기간 필터링 헬퍼
  // ============================

  private filterByPeriod<T extends { date: string }>(data: T[], period?: PeriodType, dateFrom?: string, dateTo?: string): T[] {
    let filtered = data;
    if (dateFrom) {
      filtered = filtered.filter((d) => d.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((d) => d.date <= dateTo);
    }
    return filtered;
  }

  // ============================
  // 6종 통계 조회
  // ============================

  getSummary(period?: PeriodType, dateFrom?: string, dateTo?: string): DailyStats[] {
    return this.filterByPeriod(this.dailyStats, period, dateFrom, dateTo);
  }

  getInductionStats(dateFrom?: string, dateTo?: string): InductionStats[] {
    return this.filterByPeriod(this.inductionStats, undefined, dateFrom, dateTo);
  }

  getChuteStats(dateFrom?: string, dateTo?: string): ChuteStats[] {
    return this.filterByPeriod(this.chuteStats, undefined, dateFrom, dateTo);
  }

  getCodeStats(dateFrom?: string, dateTo?: string): CodeStats[] {
    return this.filterByPeriod(this.codeStats, undefined, dateFrom, dateTo);
  }

  getSorterStats(dateFrom?: string, dateTo?: string): SorterStats[] {
    return this.filterByPeriod(this.sorterStats, undefined, dateFrom, dateTo);
  }

  getDestinationStats(dateFrom?: string, dateTo?: string): DestinationStats[] {
    return this.filterByPeriod(this.destinationStats, undefined, dateFrom, dateTo);
  }

  // ============================
  // CSV 내보내기
  // ============================

  exportToCSV(type: string): string {
    let rows: string[] = [];

    switch (type) {
      case 'summary':
        rows.push('date,totalProcessed,successCount,rejectCount,recheckCount,successRate');
        for (const s of this.dailyStats) {
          rows.push(`${s.date},${s.totalProcessed},${s.successCount},${s.rejectCount},${s.recheckCount},${s.successRate}`);
        }
        break;
      case 'induction':
        rows.push('inductionId,date,totalProcessed,successCount,rejectCount,avgProcessingTime');
        for (const s of this.inductionStats) {
          rows.push(`${s.inductionId},${s.date},${s.totalProcessed},${s.successCount},${s.rejectCount},${s.avgProcessingTime}`);
        }
        break;
      case 'chute':
        rows.push('chuteNumber,date,totalItems,destination,fullCount,nearFullCount');
        for (const s of this.chuteStats) {
          rows.push(`${s.chuteNumber},${s.date},${s.totalItems},${s.destination},${s.fullCount},${s.nearFullCount}`);
        }
        break;
      default:
        rows.push('date,totalProcessed,successCount,rejectCount,recheckCount,successRate');
        for (const s of this.dailyStats) {
          rows.push(`${s.date},${s.totalProcessed},${s.successCount},${s.rejectCount},${s.recheckCount},${s.successRate}`);
        }
    }

    return rows.join('\n');
  }

  getStatus() {
    return {
      daysOfData: this.dailyStats.length,
      totalInductionRecords: this.inductionStats.length,
      totalChuteRecords: this.chuteStats.length,
      totalCodeRecords: this.codeStats.length,
      totalSorterRecords: this.sorterStats.length,
      totalDestinationRecords: this.destinationStats.length,
    };
  }
}
