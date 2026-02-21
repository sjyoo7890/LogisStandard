import NodeEnvironment from 'jest-environment-node';
import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment';

/**
 * E2E 커스텀 Jest 환경
 * 앱 인스턴스 및 공유 리소스 관리
 */
class E2ETestEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
  }

  async setup() {
    await super.setup();

    // E2E 테스트 전역 변수 설정
    this.global.__E2E_CONFIG__ = {
      centralRelayUrl: process.env.CENTRAL_RELAY_URL || 'http://localhost:3000',
      localRelayUrl: process.env.LOCAL_RELAY_URL || 'http://localhost:3001',
      standardSwUrl: process.env.STANDARD_SW_URL || 'http://localhost:3002',
      plcSimulatorUrl: process.env.PLC_SIMULATOR_URL || 'http://localhost:3003',
      databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5442/kpost_test',
      statsDatabaseUrl: process.env.TEST_STATS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5443/kpost_stats_test',
      redisUrl: process.env.TEST_REDIS_URL || 'redis://localhost:6389',
    };

    this.global.__E2E_TIMEOUT__ = 30000;
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

export default E2ETestEnvironment;
