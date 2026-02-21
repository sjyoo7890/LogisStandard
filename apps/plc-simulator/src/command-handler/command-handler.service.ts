import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as net from 'net';
import { createLogger } from '@kpost/logger';
import {
  Telegram,
  TelegramBuilder,
  SMCToPLCTelegram,
  TELEGRAM_101_DEF,
  TELEGRAM_111_DEF,
  TELEGRAM_121_DEF,
  TELEGRAM_131_DEF,
  TELEGRAM_141_DEF,
} from '@kpost/telegram';
import { TcpServerService } from '../tcp-server/tcp-server.service';
import { SorterEngineService } from '../sorter-engine/sorter-engine.service';

@Injectable()
export class CommandHandlerService {
  private logger = createLogger({ service: 'command-handler' });

  constructor(
    private readonly tcpServer: TcpServerService,
    private readonly sorterEngine: SorterEngineService,
  ) {}

  @OnEvent('tcp.telegram.received')
  handleTelegram(payload: { channel: string; telegram: Telegram; socket: net.Socket }): void {
    const { telegram, socket } = payload;
    const telegramNo = telegram.header.telegramNo;
    const data = telegram.data as Record<string, number>;

    switch (telegramNo) {
      case SMCToPLCTelegram.SET_CONTROL_SORTER:
        this.handleSetControlSorter(data, socket);
        break;
      case SMCToPLCTelegram.SET_CONTROL_INDUCTION:
        this.handleSetControlInduction(data, socket);
        break;
      case SMCToPLCTelegram.SET_INDUCTION_MODE:
        this.handleSetInductionMode(data, socket);
        break;
      case SMCToPLCTelegram.SET_OVERFLOW_CONFIGURATION:
        this.handleSetOverflowConfig(data, socket);
        break;
      case SMCToPLCTelegram.SET_RESET_REQUEST:
        this.handleSetResetRequest(data, socket);
        break;
      case SMCToPLCTelegram.DESTINATION_REQUEST:
        this.handleDestinationRequest(data);
        break;
      case SMCToPLCTelegram.CODE_RESULT:
        this.handleCodeResult(data);
        break;
      default:
        this.logger.debug(`Unhandled telegram: ${telegramNo}`);
    }
  }

  private handleSetControlSorter(data: Record<string, number>, socket: net.Socket): void {
    const result = this.sorterEngine.setSorterControl(data.request);
    const ack = TelegramBuilder.quickBuild(TELEGRAM_101_DEF, result);
    this.tcpServer.sendToSocket(socket, ack);
    this.logger.info(`SetControlSorter: request=${data.request}, ack sent`);
  }

  private handleSetControlInduction(data: Record<string, number>, socket: net.Socket): void {
    const result = this.sorterEngine.setInductionControl(data.inductionNo, data.request);
    const ack = TelegramBuilder.quickBuild(TELEGRAM_111_DEF, result);
    this.tcpServer.sendToSocket(socket, ack);
    this.logger.info(`SetControlInduction: ind=${data.inductionNo}, request=${data.request}`);
  }

  private handleSetInductionMode(data: Record<string, number>, socket: net.Socket): void {
    const result = this.sorterEngine.setInductionMode(data.inductionNo, data.request);
    const ack = TelegramBuilder.quickBuild(TELEGRAM_121_DEF, result);
    this.tcpServer.sendToSocket(socket, ack);
    this.logger.info(`SetInductionMode: ind=${data.inductionNo}, mode=${data.request}`);
  }

  private handleSetOverflowConfig(data: Record<string, number>, socket: net.Socket): void {
    const result = this.sorterEngine.setOverflowConfig(data as any);
    const ack = TelegramBuilder.quickBuild(TELEGRAM_131_DEF, result);
    this.tcpServer.sendToSocket(socket, ack);
    this.logger.info(`SetOverflowConfig: chute1=${data.overflowChute1}, chute2=${data.overflowChute2}`);
  }

  private handleSetResetRequest(data: Record<string, number>, socket: net.Socket): void {
    const result = this.sorterEngine.setResetRequest(data.resetModule);
    const ack = TelegramBuilder.quickBuild(TELEGRAM_141_DEF, result);
    this.tcpServer.sendToSocket(socket, ack);
    this.logger.info(`SetResetRequest: module=${data.resetModule}`);
  }

  private handleDestinationRequest(data: Record<string, number>): void {
    this.logger.debug(`DestinationRequest received: pid=${data.pid}, dest1=${data.destination1}`);
  }

  private handleCodeResult(data: Record<string, number>): void {
    this.logger.debug(`CodeResult received: cell=${data.cellIndexNo}`);
  }
}
