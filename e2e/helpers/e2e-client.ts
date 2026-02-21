import * as http from 'http';

/**
 * E2E 멀티앱 HTTP/WS 클라이언트
 */
export class E2EClient {
  private baseUrls: Record<string, string>;

  constructor(config?: {
    centralRelay?: string;
    localRelay?: string;
    standardSw?: string;
    plcSimulator?: string;
  }) {
    this.baseUrls = {
      centralRelay: config?.centralRelay || 'http://localhost:3100',
      localRelay: config?.localRelay || 'http://localhost:3101',
      standardSw: config?.standardSw || 'http://localhost:3102',
      plcSimulator: config?.plcSimulator || 'http://localhost:3103',
    };
  }

  /**
   * HTTP GET 요청
   */
  async get(app: string, path: string): Promise<{ status: number; body: any }> {
    const url = `${this.baseUrls[app]}${path}`;
    return this.request('GET', url);
  }

  /**
   * HTTP POST 요청
   */
  async post(app: string, path: string, body?: any): Promise<{ status: number; body: any }> {
    const url = `${this.baseUrls[app]}${path}`;
    return this.request('POST', url, body);
  }

  /**
   * HTTP PUT 요청
   */
  async put(app: string, path: string, body?: any): Promise<{ status: number; body: any }> {
    const url = `${this.baseUrls[app]}${path}`;
    return this.request('PUT', url, body);
  }

  /**
   * HTTP DELETE 요청
   */
  async delete(app: string, path: string): Promise<{ status: number; body: any }> {
    const url = `${this.baseUrls[app]}${path}`;
    return this.request('DELETE', url);
  }

  /**
   * HTTP 요청 실행
   */
  private request(
    method: string,
    url: string,
    body?: any,
  ): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options: http.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 0, body: parsed });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout: ${method} ${url}`));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * WebSocket 연결 (socket.io-client)
   */
  async connectWebSocket(app: string, namespace: string): Promise<any> {
    const { io } = await import('socket.io-client');
    const url = `${this.baseUrls[app]}${namespace}`;

    return new Promise((resolve, reject) => {
      const socket = io(url, {
        transports: ['websocket'],
        autoConnect: true,
        timeout: 5000,
      });

      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`WebSocket 연결 타임아웃: ${url}`));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timer);
        resolve(socket);
      });

      socket.on('connect_error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /**
   * 대기 유틸리티
   */
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
