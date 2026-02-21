/**
 * Logger 모의 객체
 */
export function createMockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
    fatal: jest.fn(),
    setContext: jest.fn(),
  };
}

export const LOGGER_SERVICE = 'LoggerService';
export const MockLoggerProvider = {
  provide: LOGGER_SERVICE,
  useFactory: createMockLogger,
};

/**
 * Winston Logger 모의 객체
 */
export function createMockWinstonLogger() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    child: jest.fn().mockReturnThis(),
    add: jest.fn(),
    remove: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    profile: jest.fn(),
  };
}
