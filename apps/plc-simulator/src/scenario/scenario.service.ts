import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';
import { delay } from '@kpost/common';
import { ScenarioDefinition, ScenarioStatus } from './scenario.types';
import { SorterEngineService } from '../sorter-engine/sorter-engine.service';
import { HeartbeatService } from '../heartbeat/heartbeat.service';
import { NORMAL_SCENARIO } from './scenarios/normal.scenario';
import { FAULT_SCENARIO } from './scenarios/fault.scenario';
import { LOAD_TEST_SCENARIO } from './scenarios/load-test.scenario';
import { OVERFLOW_SCENARIO } from './scenarios/overflow.scenario';

const ALL_SCENARIOS: ScenarioDefinition[] = [
  NORMAL_SCENARIO,
  FAULT_SCENARIO,
  LOAD_TEST_SCENARIO,
  OVERFLOW_SCENARIO,
];

@Injectable()
export class ScenarioService implements OnModuleDestroy {
  private logger = createLogger({ service: 'scenario' });
  private currentScenario?: ScenarioDefinition;
  private running = false;
  private currentStep = 0;
  private startedAt?: string;
  private completedAt?: string;
  private abortController?: AbortController;

  constructor(
    private readonly sorterEngine: SorterEngineService,
    private readonly heartbeatService: HeartbeatService,
  ) {}

  getScenarios(): ScenarioDefinition[] {
    return ALL_SCENARIOS;
  }

  async startScenario(scenarioId: string): Promise<void> {
    if (this.running) {
      throw new Error('A scenario is already running');
    }

    const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioId}`);
    }

    this.currentScenario = scenario;
    this.running = true;
    this.currentStep = 0;
    this.startedAt = new Date().toISOString();
    this.completedAt = undefined;
    this.abortController = new AbortController();

    this.logger.info(`Starting scenario: ${scenario.name}`);

    // Run in background
    this.executeScenario(scenario).catch((err) => {
      if (err.name !== 'AbortError') {
        this.logger.error(`Scenario error: ${err.message}`);
      }
    });
  }

  stopScenario(): void {
    if (!this.running) return;
    this.abortController?.abort();
    this.running = false;
    this.completedAt = new Date().toISOString();
    this.sorterEngine.stop();
    this.logger.info('Scenario stopped');
  }

  getStatus(): ScenarioStatus | null {
    if (!this.currentScenario) return null;
    return {
      id: this.currentScenario.id,
      name: this.currentScenario.name,
      running: this.running,
      currentStep: this.currentStep,
      totalSteps: this.currentScenario.steps.length,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  private async executeScenario(scenario: ScenarioDefinition): Promise<void> {
    for (let i = 0; i < scenario.steps.length; i++) {
      if (!this.running) break;
      this.currentStep = i + 1;
      const step = scenario.steps[i];

      this.logger.info(`Step ${i + 1}/${scenario.steps.length}: ${step.description}`);

      await this.executeStep(step);

      if (step.delayMs > 0) {
        await this.abortableDelay(step.delayMs);
      }
    }

    this.running = false;
    this.completedAt = new Date().toISOString();
    this.logger.info(`Scenario completed: ${scenario.name}`);
  }

  private async executeStep(step: { action: string; params?: Record<string, any> }): Promise<void> {
    switch (step.action) {
      case 'START_SORTER':
        this.heartbeatService.start();
        this.sorterEngine.start();
        break;
      case 'STOP_SORTER':
        this.sorterEngine.stop();
        this.heartbeatService.stop();
        break;
      case 'TRIGGER_FAULT':
        this.sorterEngine.triggerFault(step.params?.type, step.params?.inductionNo);
        break;
      case 'CLEAR_FAULT':
        this.sorterEngine.clearFault(step.params?.type);
        break;
      case 'UPDATE_CONFIG':
        if (step.params) {
          this.sorterEngine.updateConfig(step.params);
        }
        break;
      case 'WAIT':
        // delay is handled after executeStep
        break;
    }
  }

  private async abortableDelay(ms: number): Promise<void> {
    const CHUNK = 500;
    let remaining = ms;
    while (remaining > 0 && this.running) {
      await delay(Math.min(CHUNK, remaining));
      remaining -= CHUNK;
    }
  }

  onModuleDestroy() {
    this.stopScenario();
  }
}
