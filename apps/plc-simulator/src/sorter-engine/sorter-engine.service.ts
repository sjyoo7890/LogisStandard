import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createLogger } from '@kpost/logger';
import {
  TelegramBuilder,
  PIDGenerator,
  TELEGRAM_10_DEF,
  TELEGRAM_11_DEF,
  TELEGRAM_12_DEF,
  TELEGRAM_20_DEF,
  TELEGRAM_21_DEF,
  TELEGRAM_22_DEF,
  TELEGRAM_40_DEF,
} from '@kpost/telegram';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import {
  SorterEngineConfig,
  DEFAULT_ENGINE_CONFIG,
  VirtualSorter,
  VirtualInduction,
  VirtualChute,
  VirtualItem,
  SorterStatus,
  InductionStatus,
  InductionMode,
  DischargeStatus,
} from './sorter-engine.types';

@Injectable()
export class SorterEngineService implements OnModuleDestroy {
  private logger = createLogger({ service: 'sorter-engine' });
  private config: SorterEngineConfig = { ...DEFAULT_ENGINE_CONFIG };
  private pidGenerator = new PIDGenerator();
  private cellCounter = 0;

  private sorter: VirtualSorter = {
    status: SorterStatus.STOPPED,
    totalInducted: 0,
    totalDischarged: 0,
    totalConfirmed: 0,
    totalErrors: 0,
    totalNoRead: 0,
    totalRecirculated: 0,
  };

  private inductions: VirtualInduction[] = [];
  private chutes: VirtualChute[] = [];
  private items: VirtualItem[] = [];
  private inductionTimers: NodeJS.Timeout[] = [];
  private pendingTimers: NodeJS.Timeout[] = [];

  constructor(
    private readonly tcpServer: TcpServerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeState();
  }

  private initializeState(): void {
    this.inductions = [];
    for (let i = 1; i <= this.config.inductionCount; i++) {
      this.inductions.push({
        no: i,
        status: InductionStatus.STOPPED,
        mode: InductionMode.AUTO,
        itemCount: 0,
      });
    }

    this.chutes = [];
    for (let i = 1; i <= this.config.chuteCount; i++) {
      this.chutes.push({ no: i, itemCount: 0, overflow: false });
    }
  }

  start(): void {
    if (this.sorter.status === SorterStatus.RUNNING) return;
    this.sorter.status = SorterStatus.RUNNING;
    this.sorter.startedAt = new Date().toISOString();

    // Start all inductions
    for (const ind of this.inductions) {
      ind.status = InductionStatus.RUNNING;
    }

    this.sendSorterStatus();
    this.sendAllInductionStatus();
    this.startInductionTimers();
    this.logger.info('Sorter engine started');
  }

  stop(): void {
    if (this.sorter.status === SorterStatus.STOPPED) return;
    this.sorter.status = SorterStatus.STOPPING;
    this.sendSorterStatus();

    this.stopInductionTimers();
    this.clearPendingTimers();

    for (const ind of this.inductions) {
      ind.status = InductionStatus.STOPPED;
    }

    this.sorter.status = SorterStatus.STOPPED;
    this.sendSorterStatus();
    this.sendAllInductionStatus();
    this.logger.info('Sorter engine stopped');
  }

  reset(): void {
    this.stop();
    this.sorter = {
      status: SorterStatus.STOPPED,
      totalInducted: 0,
      totalDischarged: 0,
      totalConfirmed: 0,
      totalErrors: 0,
      totalNoRead: 0,
      totalRecirculated: 0,
    };
    this.items = [];
    this.cellCounter = 0;
    this.pidGenerator.reset();
    this.initializeState();
    this.logger.info('Sorter engine reset');
  }

  updateConfig(partial: Partial<SorterEngineConfig>): void {
    Object.assign(this.config, partial);

    // Reinitialize if counts changed
    if (partial.inductionCount || partial.chuteCount) {
      const wasRunning = this.sorter.status === SorterStatus.RUNNING;
      if (wasRunning) this.stop();
      this.initializeState();
      if (wasRunning) this.start();
    }

    // Restart induction timers if interval changed
    if (partial.inductionIntervalMs && this.sorter.status === SorterStatus.RUNNING) {
      this.stopInductionTimers();
      this.startInductionTimers();
    }

    this.logger.info('Engine config updated', { config: this.config });
  }

  // ── Control commands from SMC ──

  setSorterControl(request: number): { request: number; reason: number } {
    if (request === 1) {
      this.start();
    } else {
      this.stop();
    }
    return { request, reason: 0 };
  }

  setInductionControl(inductionNo: number, request: number): { inductionNo: number; status: number; reason: number } {
    const ind = this.inductions.find((i) => i.no === inductionNo);
    if (!ind) return { inductionNo, status: 0, reason: 1 };

    if (request === 1) {
      ind.status = InductionStatus.RUNNING;
    } else {
      ind.status = InductionStatus.STOPPED;
    }
    this.sendInductionStatus(ind);
    return { inductionNo, status: ind.status, reason: 0 };
  }

  setInductionMode(inductionNo: number, request: number): { inductionNo: number; request: number } {
    const ind = this.inductions.find((i) => i.no === inductionNo);
    if (!ind) return { inductionNo, request };

    ind.mode = request === 1 ? InductionMode.MANUAL_KEY : InductionMode.AUTO;
    this.sendInductionMode(ind);
    return { inductionNo, request };
  }

  setOverflowConfig(data: { overflowChute1: number; overflowChute2: number; maxRecirculation: number; reason: number }) {
    return { ...data, reason: 0 };
  }

  setResetRequest(resetModule: number): { resetModule: number } {
    // Clear faults
    for (const ind of this.inductions) {
      if (ind.status === InductionStatus.FAULT) {
        ind.status = InductionStatus.STOPPED;
      }
    }
    if (this.sorter.status === SorterStatus.EMERGENCY) {
      this.sorter.status = SorterStatus.STOPPED;
      this.sendSorterStatus();
    }
    this.sendAllInductionStatus();
    return { resetModule };
  }

  // ── Fault injection ──

  triggerFault(type: string, inductionNo?: number): void {
    switch (type) {
      case 'MOTOR_TRIP':
        this.sorter.status = SorterStatus.EMERGENCY;
        this.sendSorterStatus();
        this.stopInductionTimers();
        break;
      case 'JAM':
        if (inductionNo) {
          const ind = this.inductions.find((i) => i.no === inductionNo);
          if (ind) {
            ind.status = InductionStatus.FAULT;
            this.sendInductionStatus(ind);
          }
        }
        break;
      case 'OVERFLOW': {
        const chuteNo = inductionNo || 1;
        const chute = this.chutes.find((c) => c.no === chuteNo);
        if (chute) {
          chute.itemCount = this.config.overflowThreshold;
          chute.overflow = true;
        }
        break;
      }
    }
    this.sorter.totalErrors++;
    this.logger.warn(`Fault triggered: ${type}`, { inductionNo });
  }

  clearFault(type?: string): void {
    if (!type || type === 'MOTOR_TRIP') {
      if (this.sorter.status === SorterStatus.EMERGENCY) {
        this.sorter.status = SorterStatus.STOPPED;
        this.sendSorterStatus();
      }
    }
    if (!type || type === 'JAM') {
      for (const ind of this.inductions) {
        if (ind.status === InductionStatus.FAULT) {
          ind.status = InductionStatus.STOPPED;
          this.sendInductionStatus(ind);
        }
      }
    }
    if (!type || type === 'OVERFLOW') {
      for (const chute of this.chutes) {
        chute.overflow = false;
      }
    }
    this.logger.info(`Fault cleared: ${type || 'ALL'}`);
  }

  // ── Induction simulation ──

  private startInductionTimers(): void {
    for (const ind of this.inductions) {
      const timer = setInterval(() => {
        if (this.sorter.status !== SorterStatus.RUNNING) return;
        if (ind.status !== InductionStatus.RUNNING) return;
        this.inductItem(ind);
      }, this.config.inductionIntervalMs);
      this.inductionTimers.push(timer);
    }
  }

  private stopInductionTimers(): void {
    for (const timer of this.inductionTimers) {
      clearInterval(timer);
    }
    this.inductionTimers = [];
  }

  private clearPendingTimers(): void {
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers = [];
  }

  private inductItem(ind: VirtualInduction): void {
    this.cellCounter++;
    if (this.cellCounter > 65535) this.cellCounter = 1;

    const pid = this.pidGenerator.generate(ind.no, ind.mode === InductionMode.MANUAL_KEY ? 'key' : 'auto');
    const destination = this.pickDestination();

    const item: VirtualItem = {
      pid,
      cellIndex: this.cellCounter,
      inductionNo: ind.no,
      mode: ind.mode,
      destination,
      inductedAt: new Date().toISOString(),
      status: 'IN_TRANSIT',
    };
    this.items.push(item);
    ind.itemCount++;
    ind.lastPid = pid;
    this.sorter.totalInducted++;

    // Send Telegram 20 (ItemInducted) on port 3006
    const buf20 = TelegramBuilder.quickBuild(TELEGRAM_20_DEF, {
      cellIndex: item.cellIndex,
      inductionNo: item.inductionNo,
      mode: item.mode,
      pid: item.pid,
      cartNumber: 0,
      destination1: item.destination,
      destination2: 0,
      destination3: 0,
      destination4: 0,
      destination5: 0,
      destination6: 0,
      destination7: 0,
      destination8: 0,
    });
    this.tcpServer.sendToChannel('RECEIVE_INDUCT', buf20);

    this.eventEmitter.emit('sorter.item.inducted', item);

    // Schedule discharge after transitTimeMs
    const dischargeTimer = setTimeout(() => {
      this.dischargeItem(item);
    }, this.config.transitTimeMs);
    this.pendingTimers.push(dischargeTimer);
  }

  private dischargeItem(item: VirtualItem): void {
    if (item.status !== 'IN_TRANSIT') return;

    const isNoRead = Math.random() < this.config.noReadRate;
    const isSuccess = !isNoRead && Math.random() < this.config.sortSuccessRate;
    let chuteNumber = item.destination;
    let recirculationCount = 0;

    if (isNoRead) {
      chuteNumber = 0;
      this.sorter.totalNoRead++;
    } else if (!isSuccess) {
      recirculationCount = 1;
      this.sorter.totalRecirculated++;
    }

    item.status = 'DISCHARGED';
    item.dischargedAt = new Date().toISOString();
    this.sorter.totalDischarged++;

    // Update chute count
    if (chuteNumber > 0 && chuteNumber <= this.chutes.length) {
      const chute = this.chutes[chuteNumber - 1];
      chute.itemCount++;
      if (chute.itemCount >= this.config.overflowThreshold) {
        chute.overflow = true;
      }
    }

    // Send Telegram 21 (ItemDischarged) on port 3000
    const buf21 = TelegramBuilder.quickBuild(TELEGRAM_21_DEF, {
      cellIndex: item.cellIndex,
      inductionNo: item.inductionNo,
      mode: item.mode,
      chuteNumber,
      recirculationCount,
    });
    this.tcpServer.sendToChannel('RECEIVE_DISCHARGE', buf21);

    this.eventEmitter.emit('sorter.item.discharged', item);

    // Schedule confirm after confirmDelayMs
    const confirmTimer = setTimeout(() => {
      this.confirmItem(item, chuteNumber, recirculationCount, isNoRead, isSuccess);
    }, this.config.confirmDelayMs);
    this.pendingTimers.push(confirmTimer);
  }

  private confirmItem(
    item: VirtualItem,
    chuteNumber: number,
    recirculationCount: number,
    isNoRead: boolean,
    isSuccess: boolean,
  ): void {
    if (item.status !== 'DISCHARGED') return;
    item.status = 'CONFIRMED';
    this.sorter.totalConfirmed++;

    let status: DischargeStatus;
    if (isNoRead) {
      status = DischargeStatus.NO_READ;
    } else if (!isSuccess) {
      status = DischargeStatus.RECIRCULATION;
    } else {
      status = DischargeStatus.NORMAL;
    }

    // Send Telegram 22 (ItemSortedConfirm) on port 3004
    const buf22 = TelegramBuilder.quickBuild(TELEGRAM_22_DEF, {
      cellIndex: item.cellIndex,
      mode: item.mode,
      chuteNumber,
      recirculationCount,
      status,
    });
    this.tcpServer.sendToChannel('RECEIVE_CONFIRM', buf22);

    this.eventEmitter.emit('sorter.item.confirmed', item);

    // Remove from active items
    this.items = this.items.filter((i) => i !== item);
  }

  private pickDestination(): number {
    return Math.floor(Math.random() * this.config.chuteCount) + 1;
  }

  // ── Status telegram sending ──

  private sendSorterStatus(): void {
    const buf = TelegramBuilder.quickBuild(TELEGRAM_10_DEF, {
      sorterStatus: this.sorter.status,
    });
    this.tcpServer.sendToChannel('RECEIVE_MCS', buf);
  }

  private sendInductionStatus(ind: VirtualInduction): void {
    const buf = TelegramBuilder.quickBuild(TELEGRAM_11_DEF, {
      inductionCount: this.config.inductionCount,
      inductionNo: ind.no,
      inductionStatus: ind.status,
    });
    this.tcpServer.sendToChannel('RECEIVE_MCS', buf);
  }

  private sendInductionMode(ind: VirtualInduction): void {
    const buf = TelegramBuilder.quickBuild(TELEGRAM_12_DEF, {
      inductionCount: this.config.inductionCount,
      inductionNo: ind.no,
      inductionMode: ind.mode,
    });
    this.tcpServer.sendToChannel('RECEIVE_MCS', buf);
  }

  private sendAllInductionStatus(): void {
    for (const ind of this.inductions) {
      this.sendInductionStatus(ind);
    }
  }

  /** Manually inject a single item for testing */
  injectItem(inductionNo: number): VirtualItem | null {
    const ind = this.inductions.find((i) => i.no === inductionNo);
    if (!ind) return null;
    this.inductItem(ind);
    return this.items[this.items.length - 1] || null;
  }

  // ── State getters ──

  getConfig(): SorterEngineConfig {
    return { ...this.config };
  }

  getSorterState(): VirtualSorter {
    return { ...this.sorter };
  }

  getInductions(): VirtualInduction[] {
    return this.inductions.map((i) => ({ ...i }));
  }

  getChutes(): VirtualChute[] {
    return this.chutes.map((c) => ({ ...c }));
  }

  getActiveItems(): VirtualItem[] {
    return this.items.map((i) => ({ ...i }));
  }

  getFullState() {
    return {
      config: this.getConfig(),
      sorter: this.getSorterState(),
      inductions: this.getInductions(),
      chutes: this.getChutes(),
      activeItems: this.getActiveItems(),
    };
  }

  onModuleDestroy() {
    this.stop();
    this.clearPendingTimers();
  }
}
