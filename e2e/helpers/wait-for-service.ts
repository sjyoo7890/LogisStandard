import * as net from 'net';
import * as http from 'http';

/**
 * 서비스 대기 유틸리티
 */
export async function waitForPort(
  host: string,
  port: number,
  timeout = 30000,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ host, port }, () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', () => {
          socket.destroy();
          reject();
        });
        socket.setTimeout(2000, () => {
          socket.destroy();
          reject();
        });
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`포트 대기 타임아웃: ${host}:${port}`);
}

/**
 * HTTP 헬스체크 대기
 */
export async function waitForHealthCheck(
  url: string,
  timeout = 30000,
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const statusCode = await new Promise<number>((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode || 0);
        });
        req.on('error', reject);
        req.setTimeout(3000, () => {
          req.destroy();
          reject(new Error('timeout'));
        });
      });

      if (statusCode >= 200 && statusCode < 400) {
        return;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`헬스체크 타임아웃: ${url}`);
}

/**
 * 여러 서비스 동시 대기
 */
export async function waitForAllServices(
  services: Array<{ name: string; host: string; port: number }>,
  timeout = 30000,
): Promise<void> {
  console.log('[WaitForService] 서비스 대기 시작...');

  await Promise.all(
    services.map(async (svc) => {
      await waitForPort(svc.host, svc.port, timeout);
      console.log(`[WaitForService] ${svc.name} (${svc.host}:${svc.port}) 준비 완료`);
    }),
  );

  console.log('[WaitForService] 모든 서비스 준비 완료');
}
