import { INestApplication } from '@nestjs/common';

/**
 * WebSocket 테스트 헬퍼
 * socket.io-client를 사용한 WebSocket 연결 및 이벤트 테스트
 */
export class WebSocketTestHelper {
  private sockets: any[] = [];

  /**
   * WebSocket 클라이언트 연결
   */
  async connect(
    app: INestApplication,
    namespace: string,
    options?: Record<string, any>,
  ): Promise<any> {
    const { io } = await import('socket.io-client');
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address?.port;
    const url = `http://localhost:${port}${namespace}`;

    return new Promise((resolve, reject) => {
      const socket = io(url, {
        transports: ['websocket'],
        autoConnect: true,
        ...options,
      });

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`WebSocket connection timeout: ${url}`));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        this.sockets.push(socket);
        resolve(socket);
      });

      socket.on('connect_error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * 이벤트 수신 대기
   */
  static waitForEvent<T = any>(
    socket: any,
    event: string,
    timeout = 5000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      socket.once(event, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  /**
   * 여러 이벤트 수집
   */
  static collectEvents<T = any>(
    socket: any,
    event: string,
    count: number,
    timeout = 10000,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const events: T[] = [];
      const timer = setTimeout(() => {
        socket.off(event);
        if (events.length > 0) {
          resolve(events);
        } else {
          reject(new Error(`Timeout collecting events: ${event}`));
        }
      }, timeout);

      const handler = (data: T) => {
        events.push(data);
        if (events.length >= count) {
          clearTimeout(timer);
          socket.off(event, handler);
          resolve(events);
        }
      };

      socket.on(event, handler);
    });
  }

  /**
   * 이벤트 발행 후 응답 대기
   */
  static emitAndWait<T = any>(
    socket: any,
    emitEvent: string,
    data: any,
    responseEvent: string,
    timeout = 5000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for response: ${responseEvent}`));
      }, timeout);

      socket.once(responseEvent, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });

      socket.emit(emitEvent, data);
    });
  }

  /**
   * 모든 소켓 연결 해제
   */
  async disconnectAll(): Promise<void> {
    for (const socket of this.sockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    this.sockets = [];
  }
}
