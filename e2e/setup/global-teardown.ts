import { execSync } from 'child_process';
import * as path from 'path';

/**
 * E2E 글로벌 정리 - Docker Compose 종료
 */
export default async function globalTeardown() {
  const rootDir = path.resolve(__dirname, '../..');
  const composeFile = path.join(rootDir, 'docker', 'docker-compose.test.yml');

  console.log('[E2E Teardown] Docker Compose 테스트 인프라 종료...');

  try {
    execSync(`docker compose -f "${composeFile}" down -v --remove-orphans`, {
      cwd: rootDir,
      stdio: 'pipe',
      timeout: 30000,
    });
    console.log('[E2E Teardown] Docker 컨테이너 종료 완료');
  } catch (error) {
    console.error('[E2E Teardown] Docker 종료 중 오류:', error);
  }
}
