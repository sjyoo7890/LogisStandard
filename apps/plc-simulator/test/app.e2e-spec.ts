import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TcpServerService } from '../src/tcp-server/tcp-server.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * PLC 시뮬레이터 E2E 테스트
 *
 * AppModule 전체를 로드하되, TCP 서버는 실제 포트 바인딩을 피하기 위해 모킹합니다.
 * HTTP API 엔드포인트의 정상 동작을 검증합니다.
 */

// TcpServerService 실제 포트 바인딩을 차단하기 위한 모킹
const mockTcpServerService = {
  startAllServers: jest.fn(),
  stopAllServers: jest.fn(),
  handleConnection: jest.fn(),
  handleData: jest.fn(),
  sendToChannel: jest.fn().mockReturnValue(true),
  sendToSocket: jest.fn().mockReturnValue(true),
  getTelegramLog: jest.fn().mockReturnValue([]),
  getChannelStatus: jest.fn().mockReturnValue([
    { name: 'SEND_HEARTBEAT', port: 3001, clientCount: 0, stats: { telegramsSent: 0, telegramsReceived: 0, bytesTransferred: 0 } },
    { name: 'RECEIVE_MCS', port: 3010, clientCount: 0, stats: { telegramsSent: 0, telegramsReceived: 0, bytesTransferred: 0 } },
  ]),
  hasClients: jest.fn().mockReturnValue(false),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
};

describe('PLC 시뮬레이터 E2E 테스트', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TcpServerService)
      .useValue(mockTcpServerService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // 테스트 1: HTTP API 헬스체크
  describe('GET /health - 헬스체크 API', () => {
    it('시뮬레이터 상태를 정상으로 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'plc-simulator');
      expect(response.body).toHaveProperty('timestamp');
      // timestamp 형식 검증 (ISO 8601)
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });

  // 테스트 2: GET /api/simulation/status - 시뮬레이션 상태 조회
  describe('GET /api/simulation/status - 시뮬레이션 상태 조회', () => {
    it('구분기 상태, 하트비트, 설정 정보를 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/simulation/status')
        .expect(200);

      // 구분기 상태 객체가 포함되어야 한다
      expect(response.body).toHaveProperty('sorter');
      expect(response.body.sorter).toHaveProperty('status');
      expect(response.body.sorter).toHaveProperty('totalInducted');
      expect(response.body.sorter).toHaveProperty('totalDischarged');

      // 하트비트 상태 객체가 포함되어야 한다
      expect(response.body).toHaveProperty('heartbeat');
      expect(response.body.heartbeat).toHaveProperty('running');
      expect(response.body.heartbeat).toHaveProperty('heartbeatNo');

      // 엔진 설정 객체가 포함되어야 한다
      expect(response.body).toHaveProperty('config');
      expect(response.body.config).toHaveProperty('inductionCount');
      expect(response.body.config).toHaveProperty('chuteCount');
    });
  });

  // 테스트 3: GET /api/simulation/channels - TCP 채널 상태 조회
  describe('GET /api/simulation/channels - TCP 채널 상태 조회', () => {
    it('모든 TCP 채널의 상태 배열을 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/simulation/channels')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      // 각 채널은 name, port, clientCount, stats 속성을 가져야 한다
      const channel = response.body[0];
      expect(channel).toHaveProperty('name');
      expect(channel).toHaveProperty('port');
      expect(channel).toHaveProperty('clientCount');
      expect(channel).toHaveProperty('stats');
    });
  });

  // 테스트 4: POST /api/simulation/scenario/start - 시나리오 시작
  describe('POST /api/simulation/scenario/start - 시나리오 시작', () => {
    it('유효한 시나리오 ID로 시나리오를 시작할 수 있어야 한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/simulation/scenario/start')
        .send({ scenarioId: 'normal' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('normal');

      // 시나리오가 실행 중이면 정지시킨다
      await request(app.getHttpServer())
        .post('/api/simulation/scenario/stop')
        .expect(200);
    });

    it('존재하지 않는 시나리오 ID로 요청하면 에러를 반환해야 한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/simulation/scenario/start')
        .send({ scenarioId: 'non-existent-scenario' })
        .expect(500);
    });
  });
});
