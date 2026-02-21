import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as net from 'net';
import { createLogger } from '@kpost/logger';
import {
  CHANNELS,
  TelegramParser,
  TelegramRegistry,
  STX,
  HEADER_SIZE,
} from '@kpost/telegram';
import { TCPChannelServer, TelegramLogEntry } from './tcp-server.types';

@Injectable()
export class TcpServerService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'tcp-server' });
  private servers = new Map<string, TCPChannelServer>();
  private telegramLog: TelegramLogEntry[] = [];
  private static readonly MAX_LOG_SIZE = 1000;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.startAllServers();
  }

  onModuleDestroy() {
    this.stopAllServers();
  }

  private startAllServers(): void {
    for (const [key, config] of Object.entries(CHANNELS)) {
      const channelServer: TCPChannelServer = {
        name: key,
        port: config.port,
        server: net.createServer(),
        clients: [],
        rxBuffer: new Map(),
        stats: {
          telegramsSent: 0,
          telegramsReceived: 0,
          bytesTransferred: 0,
        },
      };

      channelServer.server.on('connection', (socket) => {
        this.handleConnection(channelServer, socket);
      });

      channelServer.server.on('error', (err) => {
        this.logger.error(`TCP server error on ${key}:${config.port}`, { error: err.message });
      });

      channelServer.server.listen(config.port, () => {
        this.logger.info(`TCP channel ${key} listening on port ${config.port}`);
      });

      this.servers.set(key, channelServer);
    }
  }

  private handleConnection(channel: TCPChannelServer, socket: net.Socket): void {
    const addr = `${socket.remoteAddress}:${socket.remotePort}`;
    this.logger.info(`Client connected to ${channel.name}:${channel.port} from ${addr}`);
    channel.clients.push(socket);
    channel.rxBuffer.set(socket, Buffer.alloc(0));

    this.eventEmitter.emit('tcp.client.connected', {
      channel: channel.name,
      port: channel.port,
      address: addr,
    });

    socket.on('data', (data) => {
      this.handleData(channel, socket, data);
    });

    socket.on('close', () => {
      this.logger.info(`Client disconnected from ${channel.name}:${channel.port}`);
      channel.clients = channel.clients.filter((c) => c !== socket);
      channel.rxBuffer.delete(socket);
      this.eventEmitter.emit('tcp.client.disconnected', {
        channel: channel.name,
        port: channel.port,
      });
    });

    socket.on('error', (err) => {
      this.logger.error(`Socket error on ${channel.name}`, { error: err.message });
    });
  }

  private handleData(channel: TCPChannelServer, socket: net.Socket, data: Buffer): void {
    let buffer = Buffer.concat([channel.rxBuffer.get(socket) || Buffer.alloc(0), data]);

    while (buffer.length > 0) {
      // Find STX
      const stxIndex = buffer.indexOf(STX);
      if (stxIndex === -1) {
        buffer = Buffer.alloc(0);
        break;
      }

      if (stxIndex > 0) {
        buffer = buffer.subarray(stxIndex);
      }

      // Need at least HEADER_SIZE to read dataLength
      if (buffer.length < HEADER_SIZE) break;

      const dataLength = buffer.readUInt16BE(10);
      const totalSize = HEADER_SIZE + dataLength + 1; // +1 for ETX

      if (buffer.length < totalSize) break;

      const frame = buffer.subarray(0, totalSize);
      buffer = buffer.subarray(totalSize);

      try {
        const telegram = TelegramParser.autoParse(frame);
        const def = TelegramRegistry.get(telegram.header.telegramNo);

        channel.stats.telegramsReceived++;
        channel.stats.bytesTransferred += frame.length;
        channel.stats.lastActivity = new Date().toISOString();

        const logEntry: TelegramLogEntry = {
          timestamp: new Date().toISOString(),
          channel: channel.name,
          port: channel.port,
          direction: 'RX',
          telegramNo: telegram.header.telegramNo,
          telegramName: def?.name || `Unknown(${telegram.header.telegramNo})`,
          dataHex: frame.toString('hex').toUpperCase(),
          size: frame.length,
          parsedData: telegram.data as Record<string, number>,
        };
        this.addLog(logEntry);

        this.eventEmitter.emit('tcp.telegram.received', {
          channel: channel.name,
          port: channel.port,
          telegram,
          rawBuffer: frame,
          socket,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to parse telegram on ${channel.name}`, { error: err.message });
      }
    }

    channel.rxBuffer.set(socket, buffer);
  }

  /**
   * Send buffer to all clients connected to a specific channel
   */
  sendToChannel(channelName: string, buffer: Buffer): boolean {
    const channel = this.servers.get(channelName);
    if (!channel || channel.clients.length === 0) return false;

    for (const client of channel.clients) {
      if (!client.destroyed) {
        client.write(buffer);
      }
    }

    channel.stats.telegramsSent++;
    channel.stats.bytesTransferred += buffer.length;
    channel.stats.lastActivity = new Date().toISOString();

    try {
      const header = TelegramParser.parseHeader(buffer);
      const def = TelegramRegistry.get(header.telegramNo);
      const logEntry: TelegramLogEntry = {
        timestamp: new Date().toISOString(),
        channel: channelName,
        port: channel.port,
        direction: 'TX',
        telegramNo: header.telegramNo,
        telegramName: def?.name || `Unknown(${header.telegramNo})`,
        dataHex: buffer.toString('hex').toUpperCase(),
        size: buffer.length,
      };
      this.addLog(logEntry);
      this.eventEmitter.emit('tcp.telegram.sent', { channel: channelName, logEntry });
    } catch {
      // ignore parse errors for logging
    }

    return true;
  }

  /**
   * Send buffer to a specific socket (for ACK responses)
   */
  sendToSocket(socket: net.Socket, buffer: Buffer): boolean {
    if (socket.destroyed) return false;
    socket.write(buffer);
    return true;
  }

  private addLog(entry: TelegramLogEntry): void {
    this.telegramLog.unshift(entry);
    if (this.telegramLog.length > TcpServerService.MAX_LOG_SIZE) {
      this.telegramLog.length = TcpServerService.MAX_LOG_SIZE;
    }
    this.eventEmitter.emit('tcp.log', entry);
  }

  getTelegramLog(limit = 100): TelegramLogEntry[] {
    return this.telegramLog.slice(0, limit);
  }

  getChannelStatus(): Array<{
    name: string;
    port: number;
    clientCount: number;
    stats: TCPChannelServer['stats'];
  }> {
    return Array.from(this.servers.entries()).map(([name, ch]) => ({
      name,
      port: ch.port,
      clientCount: ch.clients.length,
      stats: { ...ch.stats },
    }));
  }

  hasClients(channelName: string): boolean {
    const ch = this.servers.get(channelName);
    return !!ch && ch.clients.length > 0;
  }

  private stopAllServers(): void {
    for (const [name, ch] of this.servers) {
      for (const client of ch.clients) {
        client.destroy();
      }
      ch.server.close();
      this.logger.info(`TCP server ${name} stopped`);
    }
    this.servers.clear();
  }
}
