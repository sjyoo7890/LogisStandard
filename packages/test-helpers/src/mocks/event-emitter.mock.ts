/**
 * EventEmitter2 모의 객체
 */
export function createMockEventEmitter() {
  const handlers = new Map<string, Function[]>();

  return {
    emit: jest.fn().mockImplementation((event: string, ...args: any[]) => {
      const fns = handlers.get(event) || [];
      fns.forEach((fn) => fn(...args));
      return true;
    }),
    on: jest.fn().mockImplementation((event: string, handler: Function) => {
      const existing = handlers.get(event) || [];
      existing.push(handler);
      handlers.set(event, existing);
      return { unsubscribe: () => {} };
    }),
    once: jest.fn().mockImplementation((event: string, handler: Function) => {
      const wrappedHandler = (...args: any[]) => {
        handler(...args);
        const fns = handlers.get(event) || [];
        handlers.set(event, fns.filter((f) => f !== wrappedHandler));
      };
      const existing = handlers.get(event) || [];
      existing.push(wrappedHandler);
      handlers.set(event, existing);
    }),
    off: jest.fn().mockImplementation((event: string, handler: Function) => {
      const existing = handlers.get(event) || [];
      handlers.set(event, existing.filter((f) => f !== handler));
    }),
    removeAllListeners: jest.fn().mockImplementation((event?: string) => {
      if (event) {
        handlers.delete(event);
      } else {
        handlers.clear();
      }
    }),
    listenerCount: jest.fn().mockImplementation((event: string) => {
      return (handlers.get(event) || []).length;
    }),
    eventNames: jest.fn().mockImplementation(() => [...handlers.keys()]),
    _handlers: handlers,
  };
}

export const EVENT_EMITTER = 'EventEmitter2';
export const MockEventEmitterProvider = {
  provide: EVENT_EMITTER,
  useFactory: createMockEventEmitter,
};
