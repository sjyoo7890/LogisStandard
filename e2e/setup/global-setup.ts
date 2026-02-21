import { execSync } from 'child_process';
import * as path from 'path';

/**
 * E2E 글로벌 설정 - Docker Compose 기동 + 헬스체크 대기
 */
export default async function globalSetup() {
  const rootDir = path.resolve(__dirname, '../..');
  const composeFile = path.join(rootDir, 'docker', 'docker-compose.test.yml');

  console.log('[E2E Setup] Docker Compose 테스트 인프라 시작...');

  try {
    // Docker Compose 시작
    execSync(`docker compose -f "${composeFile}" up -d --wait`, {
      cwd: rootDir,
      stdio: 'pipe',
      timeout: 60000,
    });
    console.log('[E2E Setup] Docker 컨테이너 시작 완료');

    // 헬스체크 대기
    await waitForService('PostgreSQL (Main)', 'localhost', 5442, 30000);
    await waitForService('PostgreSQL (Stats)', 'localhost', 5443, 30000);
    await waitForService('Redis', 'localhost', 6389, 15000);

    console.log('[E2E Setup] 모든 인프라 서비스 준비 완료');
  } catch (error) {
    console.error('[E2E Setup] 인프라 시작 실패:', error);
    // 실패 시 정리
    try {
      execSync(`docker compose -f "${composeFile}" down -v`, {
        cwd: rootDir,
        stdio: 'pipe',
      });
    } catch {
      // 무시
    }
    throw error;
  }
}

async function waitForService(
  name: string,
  host: string,
  port: number,
  timeout: number,
): Promise<void> {
  const start = Date.now();
  const net = await import('net');

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
      console.log(`[E2E Setup] ${name} (${host}:${port}) 준비 완료`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`[E2E Setup] ${name} (${host}:${port}) 연결 타임아웃`);
}
