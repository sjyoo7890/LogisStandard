import { ScenarioDefinition } from '../scenario.types';

export const OVERFLOW_SCENARIO: ScenarioDefinition = {
  id: 'overflow',
  name: '슈트 만재 시나리오',
  description: '특정 슈트에 우편물 집중 배출 → 만재 발생',
  steps: [
    { action: 'UPDATE_CONFIG', delayMs: 0, params: { overflowThreshold: 10, chuteCount: 5 }, description: '만재 임계값 10, 슈트 5개로 설정' },
    { action: 'START_SORTER', delayMs: 0, description: '구분기 가동' },
    { action: 'WAIT', delayMs: 20000, description: '20초 운영 (만재 발생 대기)' },
    { action: 'TRIGGER_FAULT', delayMs: 0, params: { type: 'OVERFLOW', inductionNo: 1 }, description: '슈트 1 강제 만재' },
    { action: 'WAIT', delayMs: 5000, description: '5초 대기' },
    { action: 'CLEAR_FAULT', delayMs: 0, params: { type: 'OVERFLOW' }, description: '만재 해제' },
    { action: 'STOP_SORTER', delayMs: 0, description: '구분기 정지' },
  ],
};
