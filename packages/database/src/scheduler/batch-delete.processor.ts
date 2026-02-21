import { PrismaClient } from '@prisma/client';
import { Job } from 'bull';

/**
 * BATCH_DELETE Processor
 *
 * 매일 오후 12시 15분 실행:
 * - Local 통계(전체): 60일 이전 데이터 삭제
 * - 걸업이력(장비상태이력): 60일 이전
 * - 구분 데이터(소포정보): 60일 이전
 * - SIMS 통계(전체): 3일 이전
 * - 접수정보: 7일 이전
 * - 체결/구분 정보: 14일 이전
 */
export class BatchDeleteProcessor {
  constructor(private prisma: PrismaClient) {}

  /**
   * 기준일 계산 (현재일 기준 N일 전)
   */
  private getCutoffDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Local 통계 데이터 삭제 (60일 이전)
   * - 요약 통계, 인덕션별 통계, 구분구별 통계, 코드별 통계, 구분기별 통계
   */
  async deleteLocalStats(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 60;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] Local Stats - retention: ${retentionDays}d, cutoff: ${cutoffDate.toISOString()}`);

    const results = await Promise.all([
      this.prisma.tbStatSummaryStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.tbStatInductionStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.tbStatChuteStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.tbStatCodeStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.tbStatSorterStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
    ]);

    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`[BATCH_DELETE] Local Stats - ${totalDeleted} records deleted`);
  }

  /**
   * 장비 상태 이력 삭제 (60일 이전)
   */
  async deleteMachineState(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 60;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] Machine State - retention: ${retentionDays}d`);

    const result = await this.prisma.tbOperMachineStateHt.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`[BATCH_DELETE] Machine State - ${result.count} records deleted`);
  }

  /**
   * 구분 데이터(소포정보) 삭제 (60일 이전)
   */
  async deleteSortData(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 60;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] Sort Data - retention: ${retentionDays}d`);

    const result = await this.prisma.tbItemParcelDt.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`[BATCH_DELETE] Sort Data - ${result.count} records deleted`);
  }

  /**
   * SIMS 통계 데이터 삭제 (3일 이전)
   * - 전체 통계, 공급부 통계, 구분구 통계, 우편번호 통계, 설비상태정보
   */
  async deleteSimsStats(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 3;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] SIMS Stats - retention: ${retentionDays}d`);

    const results = await Promise.all([
      this.prisma.psmStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.psmInductionStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.psmChuteStatistics.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.psmPostAmount.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.poemT0050.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
    ]);

    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`[BATCH_DELETE] SIMS Stats - ${totalDeleted} records deleted`);
  }

  /**
   * 접수정보 삭제 (7일 이전)
   */
  async deleteRegiInfo(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 7;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] Regi Info - retention: ${retentionDays}d`);

    const result = await this.prisma.tbSimRegiInfo.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`[BATCH_DELETE] Regi Info - ${result.count} records deleted`);
  }

  /**
   * 체결/구분 정보 삭제 (14일 이전)
   * - SIMS 구분정보 연계, 완료 확인
   */
  async deleteSortResult(job: Job): Promise<void> {
    const retentionDays = job.data.retentionDays ?? 14;
    const cutoffDate = this.getCutoffDate(retentionDays);
    console.log(`[BATCH_DELETE] Sort Result - retention: ${retentionDays}d`);

    const results = await Promise.all([
      this.prisma.psmRegPostResult.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prisma.psmRequest.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
    ]);

    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`[BATCH_DELETE] Sort Result - ${totalDeleted} records deleted`);
  }
}
