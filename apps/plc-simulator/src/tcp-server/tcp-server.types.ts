import * as net from 'net';

export interface TCPChannelServer {
  name: string;
  port: number;
  server: net.Server;
  clients: net.Socket[];
  rxBuffer: Map<net.Socket, Buffer>;
  stats: {
    telegramsSent: number;
    telegramsReceived: number;
    bytesTransferred: number;
    lastActivity?: string;
  };
}

export interface TelegramLogEntry {
  timestamp: string;
  channel: string;
  port: number;
  direction: 'TX' | 'RX';
  telegramNo: number;
  telegramName: string;
  dataHex: string;
  size: number;
  parsedData?: Record<string, number>;
}
