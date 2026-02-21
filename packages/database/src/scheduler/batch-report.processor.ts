import { PrismaClient } from '@prisma/client';
import { Job } from 'bull';

/**
 * BATCH_REPORT Processor
 *
 * Local 통계 집계 (매 10분):
 *   - 전체 요약 통계, 인덕션별 통계, 구분구별 통계, 코드별 통계, 구분기별 통계
 *
 * SIMS 송신용 통계 (매 30분):
 *   - 전체 통계, 구분구별 통계, 코드별 통계, 구분기별 통계
 */
export class BatchReportProcessor {
  constructor(private prisma: PrismaClient) {}

  /**
   * 현재 시간 정보 (YYYYMMDD, HHmmss)
   */
  private getNow(): { statDate: string; statTime: string } {
    const now = new Date();
    const statDate = now.toISOString().slice(0, 10).replace(/-/g, '');
    const statTime = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return { statDate, statTime };
  }

  // ==========================================================================
  // Local 통계 (매 10분)
  // ==========================================================================

  /**
   * Local 전체 요약 통계 집계
   */
  async processLocalSummaryStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] Local Summary Stats - ${statDate} ${statTime}`);

    // 모든 구분기에 대해 통계 집계
    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      // 소포 데이터에서 현재 집계 기간의 데이터 카운트
      const stats = await this.prisma.tbItemParcelDt.groupBy({
        by: ['resultCode'],
        where: {
          machineId: machine.machineId,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000), // 최근 10분
          },
        },
        _count: true,
      });

      let totalCount = 0;
      let normalCount = 0;
      let rejectCount = 0;
      let noReadCount = 0;
      let noMatchCount = 0;

      for (const stat of stats) {
        const count = stat._count;
        totalCount += count;
        switch (stat.resultCode) {
          case 'OK': normalCount += count; break;
          case 'RJ': rejectCount += count; break;
          case 'NR': noReadCount += count; break;
          case 'NM': noMatchCount += count; break;
        }
      }

      // 시간당 처리량 계산 (10분 데이터 기준)
      const throughput = totalCount * 6; // 10분 → 1시간 환산

      await this.prisma.tbStatSummaryStatistics.create({
        data: {
          machineId: machine.machineId,
          statDate,
          statTime,
          totalCount,
          normalCount,
          rejectCount,
          noReadCount,
          noMatchCount,
          throughput,
        },
      });
    }
  }

  /**
   * Local Induction별 통계 집계
   */
  async processLocalInductionStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] Local Induction Stats - ${statDate} ${statTime}`);

    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      const stats = await this.prisma.tbItemParcelDt.groupBy({
        by: ['inductionNo', 'resultCode'],
        where: {
          machineId: machine.machineId,
          inductionNo: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        _count: true,
      });

      // inductionNo별로 그룹핑
      const inductionMap = new Map<number, {
        totalCount: number; normalCount: number;
        rejectCount: number; noReadCount: number; noMatchCount: number;
      }>();

      for (const stat of stats) {
        if (stat.inductionNo === null) continue;
        const existing = inductionMap.get(stat.inductionNo) ?? {
          totalCount: 0, normalCount: 0, rejectCount: 0, noReadCount: 0, noMatchCount: 0,
        };
        existing.totalCount += stat._count;
        switch (stat.resultCode) {
          case 'OK': existing.normalCount += stat._count; break;
          case 'RJ': existing.rejectCount += stat._count; break;
          case 'NR': existing.noReadCount += stat._count; break;
          case 'NM': existing.noMatchCount += stat._count; break;
        }
        inductionMap.set(stat.inductionNo, existing);
      }

      for (const [inductionNo, counts] of inductionMap) {
        await this.prisma.tbStatInductionStatistics.create({
          data: {
            machineId: machine.machineId,
            inductionNo,
            statDate,
            statTime,
            ...counts,
          },
        });
      }
    }
  }

  /**
   * Local Chute별 통계 집계
   */
  async processLocalChuteStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] Local Chute Stats - ${statDate} ${statTime}`);

    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      const stats = await this.prisma.tbItemParcelDt.groupBy({
        by: ['chuteNo'],
        where: {
          machineId: machine.machineId,
          chuteNo: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        _count: true,
      });

      for (const stat of stats) {
        if (stat.chuteNo === null) continue;

        // 슈트에 설정된 행선지 정보 조회
        const chuteInfo = await this.prisma.tbOperChuteManagementDt.findUnique({
          where: {
            machineId_chuteNo: {
              machineId: machine.machineId,
              chuteNo: stat.chuteNo,
            },
          },
        });

        await this.prisma.tbStatChuteStatistics.create({
          data: {
            machineId: machine.machineId,
            chuteNo: stat.chuteNo,
            statDate,
            statTime,
            totalCount: stat._count,
            destCode: chuteInfo?.destCode,
            destName: chuteInfo?.destName,
          },
        });
      }
    }
  }

  /**
   * Local 우편번호 코드별 통계 집계
   */
  async processLocalCodeStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] Local Code Stats - ${statDate} ${statTime}`);

    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      const stats = await this.prisma.tbItemParcelDt.groupBy({
        by: ['sortCode', 'chuteNo'],
        where: {
          machineId: machine.machineId,
          sortCode: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        _count: true,
      });

      for (const stat of stats) {
        if (!stat.sortCode) continue;
        await this.prisma.tbStatCodeStatistics.create({
          data: {
            machineId: machine.machineId,
            sortCode: stat.sortCode,
            statDate,
            statTime,
            totalCount: stat._count,
            chuteNo: stat.chuteNo,
          },
        });
      }
    }
  }

  /**
   * Local 구분기 통계 집계
   */
  async processLocalSorterStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] Local Sorter Stats - ${statDate} ${statTime}`);

    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      // 최근 10분간 장비 상태 이력으로 가동시간 계산
      const stateHistory = await this.prisma.tbOperMachineStateHt.findMany({
        where: {
          machineId: machine.machineId,
          occurredAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
      });

      let runningTime = 0;
      let stoppedTime = 0;
      let errorTime = 0;
      for (const state of stateHistory) {
        const duration = state.duration ?? 0;
        switch (state.stateCode) {
          case 'RUN': runningTime += duration; break;
          case 'STOP': stoppedTime += duration; break;
          case 'ERR': errorTime += duration; break;
        }
      }

      // 소포 처리 카운트
      const parcelStats = await this.prisma.tbItemParcelDt.groupBy({
        by: ['resultCode'],
        where: {
          machineId: machine.machineId,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        _count: true,
      });

      let totalCount = 0;
      let normalCount = 0;
      let rejectCount = 0;
      for (const stat of parcelStats) {
        totalCount += stat._count;
        if (stat.resultCode === 'OK') normalCount += stat._count;
        if (stat.resultCode === 'RJ') rejectCount += stat._count;
      }

      const totalTime = runningTime + stoppedTime + errorTime;
      const availability = totalTime > 0 ? (runningTime / totalTime) * 100 : 0;

      await this.prisma.tbStatSorterStatistics.create({
        data: {
          machineId: machine.machineId,
          statDate,
          statTime,
          runningTime,
          stoppedTime,
          errorTime,
          totalCount,
          normalCount,
          rejectCount,
          availability: Math.round(availability * 100) / 100,
        },
      });
    }
  }

  // ==========================================================================
  // SIMS 송신용 통계 (매 30분)
  // ==========================================================================

  /**
   * SIMS 전체 통계 생성
   */
  async processSimsSummaryStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] SIMS Summary Stats - ${statDate} ${statTime}`);

    // Local 요약 통계에서 최근 30분 데이터를 SIMS용으로 집계
    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      const localStats = await this.prisma.tbStatSummaryStatistics.aggregate({
        where: {
          machineId: machine.machineId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
        _sum: {
          totalCount: true,
          normalCount: true,
          rejectCount: true,
          noReadCount: true,
          noMatchCount: true,
        },
      });

      await this.prisma.psmStatistics.create({
        data: {
          machineId: machine.machineId,
          statDate,
          statTime,
          totalCount: localStats._sum.totalCount ?? 0,
          normalCount: localStats._sum.normalCount ?? 0,
          rejectCount: localStats._sum.rejectCount ?? 0,
          noReadCount: localStats._sum.noReadCount ?? 0,
          noMatchCount: localStats._sum.noMatchCount ?? 0,
          sendYn: 'N',
        },
      });
    }
  }

  /**
   * SIMS 구분구별 통계 생성
   */
  async processSimsChuteStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] SIMS Chute Stats - ${statDate} ${statTime}`);

    const localChuteStats = await this.prisma.tbStatChuteStatistics.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    });

    // machineId + chuteNo별 집계
    const chuteMap = new Map<string, {
      machineId: string; chuteNo: number; totalCount: number;
      destCode: string | null; destName: string | null;
    }>();

    for (const stat of localChuteStats) {
      const key = `${stat.machineId}_${stat.chuteNo}`;
      const existing = chuteMap.get(key);
      if (existing) {
        existing.totalCount += stat.totalCount;
      } else {
        chuteMap.set(key, {
          machineId: stat.machineId,
          chuteNo: stat.chuteNo,
          totalCount: stat.totalCount,
          destCode: stat.destCode,
          destName: stat.destName,
        });
      }
    }

    for (const data of chuteMap.values()) {
      await this.prisma.psmChuteStatistics.create({
        data: {
          machineId: data.machineId,
          chuteNo: data.chuteNo,
          statDate,
          statTime,
          totalCount: data.totalCount,
          destCode: data.destCode,
          destName: data.destName,
          sendYn: 'N',
        },
      });
    }
  }

  /**
   * SIMS 코드별 통계 생성
   */
  async processSimsCodeStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] SIMS Code Stats - ${statDate} ${statTime}`);

    const localCodeStats = await this.prisma.tbStatCodeStatistics.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    });

    // machineId + sortCode별 집계
    const codeMap = new Map<string, {
      machineId: string; sortCode: string; totalCount: number;
    }>();

    for (const stat of localCodeStats) {
      const key = `${stat.machineId}_${stat.sortCode}`;
      const existing = codeMap.get(key);
      if (existing) {
        existing.totalCount += stat.totalCount;
      } else {
        codeMap.set(key, {
          machineId: stat.machineId,
          sortCode: stat.sortCode,
          totalCount: stat.totalCount,
        });
      }
    }

    for (const data of codeMap.values()) {
      await this.prisma.psmPostAmount.create({
        data: {
          machineId: data.machineId,
          sortCode: data.sortCode,
          statDate,
          statTime,
          totalCount: data.totalCount,
          sendYn: 'N',
        },
      });
    }
  }

  /**
   * SIMS 구분기별 통계 생성 (가동률 포함)
   */
  async processSimsSorterStats(job: Job): Promise<void> {
    const { statDate, statTime } = this.getNow();
    console.log(`[BATCH_REPORT] SIMS Sorter Stats - ${statDate} ${statTime}`);

    // Local 구분기 통계에서 최근 30분 데이터를 가져와 SIMS 설비상태정보에 기록
    const machines = await this.prisma.tbModelMachineMt.findMany({
      select: { machineId: true },
    });

    for (const machine of machines) {
      const latestSorterStat = await this.prisma.tbStatSorterStatistics.findFirst({
        where: { machineId: machine.machineId },
        orderBy: { createdAt: 'desc' },
      });

      // 설비 상태 판단
      let equipmentStatus = '00'; // 정상
      if (latestSorterStat) {
        if (latestSorterStat.errorTime > 0) equipmentStatus = '02'; // 오류
        else if (latestSorterStat.stoppedTime > latestSorterStat.runningTime) equipmentStatus = '01'; // 정지
      }

      await this.prisma.poemT0050.create({
        data: {
          machineId: machine.machineId,
          equipmentStatus,
          statusName: equipmentStatus === '00' ? '정상' : equipmentStatus === '01' ? '정지' : '오류',
          occurredAt: new Date(),
          sendYn: 'N',
        },
      });
    }
  }
}
