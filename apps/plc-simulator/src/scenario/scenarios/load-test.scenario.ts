import { ScenarioDefinition } from '../scenario.types';

export const LOAD_TEST_SCENARIO: ScenarioDefinition = {
  id: 'load-test',
  name: '부하 테스트 시나리오',
  description: '투입 간격을 줄여 대량 처리 테스트',
  steps: [
    { action: 'UPDATE_CONFIG', delayMs: 0, params: { inductionIntervalMs: 100 }, description: '투입 간격 100ms로 변경' },
    { action: 'START_SORTER', delayMs: 0, description: '구분기 가동' },
    { action: 'WAIT', delayMs: 60000, description: '60초 부하 운영' },
    { action: 'STOP_SORTER', delayMs: 0, description: '구분기 정지' },
    { action: 'UPDATE_CONFIG', delayMs: 0, params: { inductionIntervalMs: 1500 }, description: '투입 간격 원복' },
  ],
};
