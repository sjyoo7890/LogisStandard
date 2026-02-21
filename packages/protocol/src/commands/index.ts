/**
 * 설비 제어 명령어 정의
 */
export enum EquipmentCommand {
  START = 'START',
  STOP = 'STOP',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  RESET = 'RESET',
  EMERGENCY_STOP = 'EMERGENCY_STOP',
}

/**
 * 명령 실행 결과
 */
export interface CommandResult {
  commandId: string;
  command: EquipmentCommand;
  success: boolean;
  message?: string;
  executedAt: string;
}
