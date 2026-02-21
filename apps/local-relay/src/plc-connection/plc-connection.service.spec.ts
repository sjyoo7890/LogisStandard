import { Test, TestingModule } from '@nestjs/testing';
import { PLCConnectionService } from './plc-connection.service';

describe('PLCConnectionService', () => {
  let service: PLCConnectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PLCConnectionService],
    }).compile();

    service = module.get<PLCConnectionService>(PLCConnectionService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with 7 channels', () => {
    const channels = service.getAllChannels();
    expect(channels.length).toBe(7);
  });

  it('should connect a channel', () => {
    const result = service.connectChannel('SEND_DESTINATION');
    expect(result).toBe(true);
    const ch = service.getChannel('SEND_DESTINATION');
    expect(ch?.status).toBe('CONNECTED');
  });

  it('should disconnect a channel', () => {
    service.connectChannel('SEND_DESTINATION');
    service.disconnectChannel('SEND_DESTINATION');
    const ch = service.getChannel('SEND_DESTINATION');
    expect(ch?.status).toBe('DISCONNECTED');
  });

  it('should return false for unknown channel', () => {
    const result = service.connectChannel('UNKNOWN');
    expect(result).toBe(false);
  });

  it('should connect all channels', () => {
    service.connectAll();
    expect(service.getConnectedCount()).toBe(7);
  });

  it('should track telegram send', () => {
    service.connectChannel('SEND_DESTINATION');
    const sent = service.sendTelegram('SEND_DESTINATION', 30, [0x02, 0x44]);
    expect(sent).toBe(true);
    const log = service.getTelegramLog();
    expect(log.length).toBe(1);
    expect(log[0].direction).toBe('SEND');
  });

  it('should not send on disconnected channel', () => {
    const sent = service.sendTelegram('SEND_DESTINATION', 30, [0x02]);
    expect(sent).toBe(false);
  });

  it('should return PLC status summary', () => {
    const status = service.getStatus();
    expect(status).toHaveProperty('totalChannels');
    expect(status).toHaveProperty('connected');
    expect(status).toHaveProperty('heartbeatCount');
    expect(status.totalChannels).toBe(7);
  });

  it('should track heartbeat count', () => {
    expect(service.getHeartbeatCount()).toBe(0);
  });
});
