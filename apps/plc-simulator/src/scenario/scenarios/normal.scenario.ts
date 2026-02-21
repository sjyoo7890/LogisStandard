import { ScenarioDefinition } from '../scenario.types';

export const NORMAL_SCENARIO: ScenarioDefinition = {
  id: 'normal',
  name: '정상 운영 시나리오',
  description: '구분기 시작 → 일정 시간 운영 → 정지',
  steps: [
    { action: 'START_SORTER', delayMs: 0, description: '구분기 가동' },
    { action: 'WAIT', delayMs: 30000, description: '30초 운영' },
    { action: 'STOP_SORTER', delayMs: 0, description: '구분기 정지' },
  ],
};
