import * as net from 'net';

/**
 * TCP 소켓 테스트 헬퍼
 * PLC 통신 시뮬레이션을 위한 TCP 클라이언트/서버 유틸리티
 */
export class TcpTestHelper {
  private servers: net.Server[] = [];
  private clients: net.Socket[] = [];

  /**
   * 테스트 TCP 서버 생성
   */
  createServer(port: number, host = '127.0.0.1'): Promise<net.Server> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(port, host, () => {
        this.servers.push(server);
        resolve(server);
      });
      server.on('error', reject);
    });
  }

  /**
   * 테스트 TCP 클라이언트 연결
   */
  connectClient(port: number, host = '127.0.0.1'): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection({ port, host }, () => {
        this.clients.push(client);
        resolve(client);
      });
      client.on('error', reject);
      setTimeout(() => reject(new Error('TCP connect timeout')), 5000);
    });
  }

  /**
   * 데이터 수신 대기
   */
  static waitForData(socket: net.Socket, timeout = 5000): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for TCP data'));
      }, timeout);

      socket.once('data', (data: Buffer) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  /**
   * 서버에 클라이언트 연결 대기
   */
  static waitForConnection(server: net.Server, timeout = 5000): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for TCP connection'));
      }, timeout);

      server.once('connection', (socket: net.Socket) => {
        clearTimeout(timer);
        resolve(socket);
      });
    });
  }

  /**
   * 전문 데이터 전송 후 응답 수신
   */
  static async sendAndReceive(
    client: net.Socket,
    data: Buffer,
    timeout = 5000,
  ): Promise<Buffer> {
    const responsePromise = TcpTestHelper.waitForData(client, timeout);
    client.write(data);
    return responsePromise;
  }

  /**
   * 포트 사용 가능 여부 확인
   */
  static checkPort(port: number, host = '127.0.0.1'): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, host);
    });
  }

  /**
   * 모든 서버 및 클라이언트 정리
   */
  async cleanup(): Promise<void> {
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients = [];

    for (const server of this.servers) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    this.servers = [];
  }
}
