import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Local Relay (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==========================================
  // System API
  // ==========================================

  describe('GET /api/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('local-relay');
          expect(res.body.version).toBe('0.1.0');
        });
    });
  });

  describe('GET /api/status', () => {
    it('should return system status', () => {
      return request(app.getHttpServer())
        .get('/api/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('system');
          expect(res.body).toHaveProperty('mode');
          expect(res.body).toHaveProperty('plc');
          expect(res.body).toHaveProperty('equipment');
          expect(res.body).toHaveProperty('simulator');
        });
    });
  });

  // ==========================================
  // PLC API
  // ==========================================

  describe('GET /api/plc/status', () => {
    it('should return PLC status', () => {
      return request(app.getHttpServer())
        .get('/api/plc/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalChannels');
          expect(res.body).toHaveProperty('connected');
          expect(res.body.totalChannels).toBe(7);
        });
    });
  });

  describe('GET /api/plc/channels', () => {
    it('should return all channels', () => {
      return request(app.getHttpServer())
        .get('/api/plc/channels')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(7);
        });
    });
  });

  // ==========================================
  // Equipment API
  // ==========================================

  describe('GET /api/equipment', () => {
    it('should return equipment list', () => {
      return request(app.getHttpServer())
        .get('/api/equipment')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(9);
        });
    });
  });

  describe('GET /api/equipment/overview', () => {
    it('should return equipment overview', () => {
      return request(app.getHttpServer())
        .get('/api/equipment/overview')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalEquipment');
          expect(res.body).toHaveProperty('running');
          expect(res.body).toHaveProperty('activeAlarms');
        });
    });
  });

  // ==========================================
  // IPS API
  // ==========================================

  describe('GET /api/ips/devices', () => {
    it('should return IPS devices', () => {
      return request(app.getHttpServer())
        .get('/api/ips/devices')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(4);
        });
    });
  });

  // ==========================================
  // Simulator API
  // ==========================================

  describe('GET /api/simulator/stats', () => {
    it('should return simulator stats', () => {
      return request(app.getHttpServer())
        .get('/api/simulator/stats')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('running');
          expect(res.body).toHaveProperty('totalItems');
        });
    });
  });

  describe('GET /api/simulator/rules', () => {
    it('should return sorting rules', () => {
      return request(app.getHttpServer())
        .get('/api/simulator/rules')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('rules');
          expect(res.body).toHaveProperty('active');
          expect(res.body.rules.length).toBe(4);
        });
    });
  });

  describe('POST /api/simulator/simulate-one', () => {
    it('should simulate one item', () => {
      return request(app.getHttpServer())
        .post('/api/simulator/simulate-one')
        .send({ barcode: '4201234567890' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('pid');
          expect(res.body).toHaveProperty('result');
          expect(res.body.barcode).toBe('4201234567890');
        });
    });
  });

  // ==========================================
  // Mode API
  // ==========================================

  describe('GET /api/mode', () => {
    it('should return current mode', () => {
      return request(app.getHttpServer())
        .get('/api/mode')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('mode');
          expect(res.body.mode).toBe('SIMULATOR');
        });
    });
  });

  describe('POST /api/mode/switch', () => {
    it('should switch to OPERATION mode', () => {
      return request(app.getHttpServer())
        .post('/api/mode/switch')
        .send({ mode: 'OPERATION', by: 'test', reason: 'E2E test' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // ==========================================
  // Test API
  // ==========================================

  describe('POST /api/test/start', () => {
    it('should run a test', () => {
      return request(app.getHttpServer())
        .post('/api/test/start')
        .send({ type: 'PROTOCOL', name: 'E2E Protocol Test' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('reportId');
          expect(res.body.type).toBe('PROTOCOL');
          expect(res.body.totalTests).toBe(6);
        });
    });
  });

  // ==========================================
  // Maintenance API
  // ==========================================

  describe('POST /api/maintenance/hw-check', () => {
    it('should run H/W check', () => {
      return request(app.getHttpServer())
        .post('/api/maintenance/hw-check')
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('reportId');
          expect(res.body.type).toBe('HW_CHECK');
          expect(res.body.items.length).toBeGreaterThanOrEqual(8);
        });
    });
  });
});
