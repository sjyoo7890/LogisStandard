/**
 * 타이머/스케줄러 테스트 헬퍼
 * Jest fake timers와 비동기 작업을 위한 유틸리티
 */
export class TimerTestHelper {
  /**
   * ms 대기 (실제 타이머)
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 조건이 true가 될 때까지 대기
   */
  static async waitUntil(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await TimerTestHelper.delay(interval);
    }
    throw new Error(`waitUntil timeout after ${timeout}ms`);
  }

  /**
   * 재시도 헬퍼 (불안정 테스트용)
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<T> {
    let lastError: Error;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (i < maxRetries - 1) {
          await TimerTestHelper.delay(delayMs);
        }
      }
    }
    throw lastError!;
  }

  /**
   * 비동기 이벤트 수집기
   */
  static createEventCollector<T>(): {
    collect: (event: T) => void;
    getEvents: () => T[];
    waitFor: (count: number, timeout?: number) => Promise<T[]>;
    clear: () => void;
  } {
    const events: T[] = [];
    const waiters: Array<{ count: number; resolve: (events: T[]) => void }> = [];

    return {
      collect: (event: T) => {
        events.push(event);
        for (const waiter of waiters) {
          if (events.length >= waiter.count) {
            waiter.resolve([...events]);
          }
        }
      },
      getEvents: () => [...events],
      waitFor: (count: number, timeout = 5000) => {
        if (events.length >= count) {
          return Promise.resolve([...events]);
        }
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Event collector timeout: got ${events.length}, expected ${count}`));
          }, timeout);

          waiters.push({
            count,
            resolve: (evts) => {
              clearTimeout(timer);
              resolve(evts);
            },
          });
        });
      },
      clear: () => {
        events.length = 0;
      },
    };
  }

  /**
   * 성능 측정 헬퍼
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; elapsed: number }> {
    const start = Date.now();
    const result = await fn();
    const elapsed = Date.now() - start;
    return { result, elapsed };
  }
}
