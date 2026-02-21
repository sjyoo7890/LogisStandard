/**
 * PID(Parcel ID) 생성 로직
 *
 * 인덕션 번호별 PID 범위:
 * - 1번 인덕션: 자동 100001~115000 / 타건 115001~130000
 * - 2번 인덕션: 자동 200001~215000 / 타건 215001~230000
 * - 3번 인덕션: 자동 300001~315000 / 타건 315001~330000
 * - 4번 인덕션: 자동 400001~415000 / 타건 415001~430000
 */

export interface PIDRange {
  autoStart: number;
  autoEnd: number;
  keyStart: number;
  keyEnd: number;
}

/**
 * 인덕션별 PID 범위 테이블
 */
export const PID_RANGES: Record<number, PIDRange> = {
  1: { autoStart: 100001, autoEnd: 115000, keyStart: 115001, keyEnd: 130000 },
  2: { autoStart: 200001, autoEnd: 215000, keyStart: 215001, keyEnd: 230000 },
  3: { autoStart: 300001, autoEnd: 315000, keyStart: 315001, keyEnd: 330000 },
  4: { autoStart: 400001, autoEnd: 415000, keyStart: 415001, keyEnd: 430000 },
};

export type PIDMode = 'auto' | 'key';

/**
 * PID 생성기
 */
export class PIDGenerator {
  private counters: Map<string, number> = new Map();

  /**
   * PID 생성
   * @param inductionNo 인덕션 번호 (1~4)
   * @param mode 'auto' | 'key'
   */
  generate(inductionNo: number, mode: PIDMode = 'auto'): number {
    const range = PID_RANGES[inductionNo];
    if (!range) {
      throw new Error(`Invalid induction number: ${inductionNo}. Must be 1-4.`);
    }

    const key = `${inductionNo}-${mode}`;
    const start = mode === 'auto' ? range.autoStart : range.keyStart;
    const end = mode === 'auto' ? range.autoEnd : range.keyEnd;

    let current = this.counters.get(key) ?? start;

    if (current > end) {
      current = start; // 순환
    }

    this.counters.set(key, current + 1);
    return current;
  }

  /**
   * 현재 카운터 조회
   */
  getCurrent(inductionNo: number, mode: PIDMode = 'auto'): number | undefined {
    return this.counters.get(`${inductionNo}-${mode}`);
  }

  /**
   * 카운터 리셋
   */
  reset(inductionNo?: number): void {
    if (inductionNo !== undefined) {
      this.counters.delete(`${inductionNo}-auto`);
      this.counters.delete(`${inductionNo}-key`);
    } else {
      this.counters.clear();
    }
  }

  /**
   * PID가 어떤 인덕션/모드에 속하는지 확인
   */
  static resolve(pid: number): { inductionNo: number; mode: PIDMode } | null {
    for (const [inductionNo, range] of Object.entries(PID_RANGES)) {
      if (pid >= range.autoStart && pid <= range.autoEnd) {
        return { inductionNo: Number(inductionNo), mode: 'auto' };
      }
      if (pid >= range.keyStart && pid <= range.keyEnd) {
        return { inductionNo: Number(inductionNo), mode: 'key' };
      }
    }
    return null;
  }
}
