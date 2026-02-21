export interface ScenarioStep {
  action: string;
  delayMs: number;
  params?: Record<string, any>;
  description: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  loop?: boolean;
}

export interface ScenarioStatus {
  id: string;
  name: string;
  running: boolean;
  currentStep: number;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
}
