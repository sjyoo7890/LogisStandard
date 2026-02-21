/**
 * Redis / Bull Queue 모의 객체
 */
export function createMockRedisClient() {
  const store = new Map<string, string>();

  return {
    get: jest.fn().mockImplementation((key: string) => Promise.resolve(store.get(key) || null)),
    set: jest.fn().mockImplementation((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
    del: jest.fn().mockImplementation((key: string) => {
      store.delete(key);
      return Promise.resolve(1);
    }),
    exists: jest.fn().mockImplementation((key: string) => Promise.resolve(store.has(key) ? 1 : 0)),
    keys: jest.fn().mockImplementation((pattern: string) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Promise.resolve([...store.keys()].filter((k) => regex.test(k)));
    }),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    hget: jest.fn().mockResolvedValue(null),
    hset: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    flushall: jest.fn().mockImplementation(() => {
      store.clear();
      return Promise.resolve('OK');
    }),
    quit: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    _store: store,
  };
}

export function createMockBullQueue(name = 'test-queue') {
  const jobs: any[] = [];

  return {
    name,
    add: jest.fn().mockImplementation((jobName: string, data: any, opts?: any) => {
      const job = {
        id: `${jobs.length + 1}`,
        name: jobName,
        data,
        opts,
        progress: jest.fn(),
        remove: jest.fn(),
        retry: jest.fn(),
        getState: jest.fn().mockResolvedValue('completed'),
      };
      jobs.push(job);
      return Promise.resolve(job);
    }),
    process: jest.fn(),
    on: jest.fn(),
    getJobs: jest.fn().mockResolvedValue(jobs),
    getJob: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(jobs.find((j) => j.id === id) || null),
    ),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue(jobs),
    getFailed: jest.fn().mockResolvedValue([]),
    clean: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    _jobs: jobs,
  };
}

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const MockRedisProvider = {
  provide: REDIS_CLIENT,
  useFactory: createMockRedisClient,
};
