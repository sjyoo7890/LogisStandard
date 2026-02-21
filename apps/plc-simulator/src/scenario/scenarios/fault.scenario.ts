import { ScenarioDefinition } from '../scenario.types';

export const FAULT_SCENARIO: ScenarioDefinition = {
  id: 'fault',
  name: '장애 시나리오',
  description: '운영 중 Motor Trip / JAM 장애 발생 및 복구',
  steps: [
    { action: 'START_SORTER', delayMs: 0, description: '구분기 가동' },
    { action: 'WAIT', delayMs: 10000, description: '10초 정상 운영' },
    { action: 'TRIGGER_FAULT', delayMs: 0, params: { type: 'JAM', inductionNo: 1 }, description: '1번 인덕션 JAM 발생' },
    { action: 'WAIT', delayMs: 5000, description: '5초 대기' },
    { action: 'CLEAR_FAULT', delayMs: 0, params: { type: 'JAM' }, description: 'JAM 복구' },
    { action: 'WAIT', delayMs: 5000, description: '5초 운영' },
    { action: 'TRIGGER_FAULT', delayMs: 0, params: { type: 'MOTOR_TRIP' }, description: 'Motor Trip 발생' },
    { action: 'WAIT', delayMs: 5000, description: '5초 대기' },
    { action: 'CLEAR_FAULT', delayMs: 0, params: { type: 'MOTOR_TRIP' }, description: 'Motor Trip 복구' },
    { action: 'STOP_SORTER', delayMs: 0, description: '구분기 정지' },
  ],
};
