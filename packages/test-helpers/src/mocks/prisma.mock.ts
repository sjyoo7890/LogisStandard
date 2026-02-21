/**
 * Prisma 클라이언트 모의 객체
 */
export function createMockPrismaClient() {
  const mockModel = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'mock-id', ...args.data })),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where?.id, ...args.data })),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    upsert: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'mock-id', ...args.create })),
  });

  return {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockImplementation((fn: any) => {
      if (typeof fn === 'function') {
        return fn(createMockPrismaClient());
      }
      return Promise.all(fn);
    }),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $executeRaw: jest.fn().mockResolvedValue(0),
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),

    // 모델별 mock
    sortingPlan: mockModel(),
    sortingRule: mockModel(),
    sortEvent: mockModel(),
    keyingRequest: mockModel(),
    bindingInfo: mockModel(),
    statistics: mockModel(),
    commLog: mockModel(),
    alarm: mockModel(),
    connection: mockModel(),
    syncJob: mockModel(),
    fallbackRecord: mockModel(),
    transferHistory: mockModel(),
    equipment: mockModel(),
    user: mockModel(),
  };
}

export const PRISMA_SERVICE = 'PrismaService';
export const MockPrismaProvider = {
  provide: PRISMA_SERVICE,
  useFactory: createMockPrismaClient,
};
