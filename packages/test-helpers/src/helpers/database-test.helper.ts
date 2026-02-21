/**
 * 데이터베이스 테스트 헬퍼
 * 테스트 DB 설정/정리, 트랜잭션 래핑
 */
export class DatabaseTestHelper {
  private cleanupCallbacks: Array<() => Promise<void>> = [];

  /**
   * 테스트 DB URL 생성
   */
  static getTestDatabaseUrl(port = 5442, dbName = 'kpost_test'): string {
    return `postgresql://postgres:postgres@localhost:${port}/${dbName}`;
  }

  /**
   * 통계 DB URL 생성
   */
  static getStatsTestDatabaseUrl(port = 5443, dbName = 'kpost_stats_test'): string {
    return `postgresql://postgres:postgres@localhost:${port}/${dbName}`;
  }

  /**
   * Redis 테스트 URL 생성
   */
  static getTestRedisUrl(port = 6389): string {
    return `redis://localhost:${port}`;
  }

  /**
   * 테이블 데이터 초기화
   */
  async truncateAll(prisma: any, tables: string[]): Promise<void> {
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }

  /**
   * 시드 데이터 삽입
   */
  async seed(prisma: any, seedFn: (p: any) => Promise<void>): Promise<void> {
    await seedFn(prisma);
    this.cleanupCallbacks.push(async () => {
      // 정리는 truncateAll로
    });
  }

  /**
   * 트랜잭션 래퍼 (테스트 후 롤백)
   */
  async withTransaction<T>(
    prisma: any,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(async (tx: any) => {
      const result = await fn(tx);
      throw new RollbackError(result);
    }).catch((err: any) => {
      if (err instanceof RollbackError) {
        return err.result;
      }
      throw err;
    });
  }

  /**
   * DB 연결 헬스체크
   */
  static async checkHealth(prisma: any): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 데이터 수 확인
   */
  static async getCount(prisma: any, model: string): Promise<number> {
    try {
      const result = await prisma[model].count();
      return result;
    } catch {
      return -1;
    }
  }

  /**
   * 정리
   */
  async cleanup(): Promise<void> {
    for (const cb of this.cleanupCallbacks) {
      await cb();
    }
    this.cleanupCallbacks = [];
  }
}

class RollbackError {
  constructor(public readonly result: any) {}
}
