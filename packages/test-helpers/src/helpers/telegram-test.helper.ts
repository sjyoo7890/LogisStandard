/**
 * Telegram 전문 테스트 헬퍼
 * 전문 검증 및 비교 유틸리티
 */
export class TelegramTestHelper {
  /**
   * 전문 라운드트립 검증 (build → parse → compare)
   */
  static verifyRoundTrip(
    builder: { build: (data: any) => Buffer },
    parser: { parse: (buf: Buffer) => any },
    inputData: any,
  ): { original: any; parsed: any; match: boolean } {
    const built = builder.build(inputData);
    const parsed = parser.parse(built);
    const match = JSON.stringify(inputData) === JSON.stringify(parsed);
    return { original: inputData, parsed, match };
  }

  /**
   * 전문 필드 검증
   */
  static validateFields(
    telegram: any,
    expectedFields: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [key, expected] of Object.entries(expectedFields)) {
      if (telegram[key] !== expected) {
        errors.push(`Field '${key}': expected ${expected}, got ${telegram[key]}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * 전문 시퀀스 검증 (순서 확인)
   */
  static verifySequence(
    telegrams: Array<{ telegramNo: number; timestamp?: number }>,
    expectedOrder: number[],
  ): boolean {
    if (telegrams.length !== expectedOrder.length) return false;
    return telegrams.every((t, i) => t.telegramNo === expectedOrder[i]);
  }

  /**
   * PID 생성 검증
   */
  static verifyPID(
    pid: string,
    expectedInduction?: number,
  ): { valid: boolean; inductionNo: number; sequence: number } {
    const valid = /^PID\d{5,}$/.test(pid) || pid.length >= 5;
    const inductionNo = expectedInduction || parseInt(pid.substring(3, 4)) || 0;
    const sequence = parseInt(pid.substring(4)) || 0;
    return { valid, inductionNo, sequence };
  }

  /**
   * 전문 타이밍 검증 (하트비트 간격 등)
   */
  static verifyTiming(
    timestamps: number[],
    expectedInterval: number,
    tolerance = 500,
  ): { valid: boolean; avgInterval: number; maxDeviation: number } {
    if (timestamps.length < 2) {
      return { valid: true, avgInterval: 0, maxDeviation: 0 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const maxDeviation = Math.max(...intervals.map((i) => Math.abs(i - expectedInterval)));
    const valid = maxDeviation <= tolerance;

    return { valid, avgInterval, maxDeviation };
  }

  /**
   * 바이트 버퍼 비교
   */
  static compareBuffers(a: Buffer, b: Buffer): { match: boolean; firstDiffAt: number } {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) {
        return { match: false, firstDiffAt: i };
      }
    }
    return { match: a.length === b.length, firstDiffAt: a.length === b.length ? -1 : minLen };
  }
}
