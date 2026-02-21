import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Central Relay (e2e)', () => {
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
          expect(res.body.service).toBe('central-relay');
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
          expect(res.body).toHaveProperty('connections');
          expect(res.body).toHaveProperty('sync');
          expect(res.body).toHaveProperty('fallback');
        });
    });
  });

  // ==========================================
  // Connections API
  // ==========================================

  describe('GET /api/connections', () => {
    it('should return all connections', () => {
      return request(app.getHttpServer())
        .get('/api/connections')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(6);
        });
    });
  });

  describe('GET /api/connections/:targetId', () => {
    it('should return SIMS connection', () => {
      return request(app.getHttpServer())
        .get('/api/connections/SIMS')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.target.id).toBe('SIMS');
        });
    });
  });

  // ==========================================
  // Sync API
  // ==========================================

  describe('POST /api/sync/trigger', () => {
    it('should trigger manual sync', () => {
      return request(app.getHttpServer())
        .post('/api/sync/trigger')
        .send({
          direction: 'SIMS_TO_CENTER',
          syncType: 'RECEPTION_INFO',
        })
        .expect(201)
        .expect((res: any) => {
          expect(res.body.direction).toBe('SIMS_TO_CENTER');
          expect(res.body.syncType).toBe('RECEPTION_INFO');
        });
    });
  });

  describe('GET /api/sync/history', () => {
    it('should return sync history', () => {
      return request(app.getHttpServer())
        .get('/api/sync/history')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status', () => {
      return request(app.getHttpServer())
        .get('/api/sync/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('currentJobs');
          expect(res.body).toHaveProperty('totalCompleted');
          expect(res.body).toHaveProperty('totalFailed');
        });
    });
  });

  // ==========================================
  // Logs API
  // ==========================================

  describe('GET /api/logs', () => {
    it('should return logs (empty initially)', () => {
      return request(app.getHttpServer())
        .get('/api/logs')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('logs');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('should support filtering by direction', () => {
      return request(app.getHttpServer())
        .get('/api/logs?direction=INBOUND')
        .expect(200);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/logs?limit=10&offset=0')
        .expect(200);
    });
  });

  describe('GET /api/logs/stats', () => {
    it('should return log statistics', () => {
      return request(app.getHttpServer())
        .get('/api/logs/stats')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalLogs');
          expect(res.body).toHaveProperty('byDirection');
          expect(res.body).toHaveProperty('byLevel');
        });
    });
  });

  // ==========================================
  // Fallback API
  // ==========================================

  describe('GET /api/fallback/status', () => {
    it('should return fallback status', () => {
      return request(app.getHttpServer())
        .get('/api/fallback/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.status).toBe('INACTIVE');
          expect(res.body.pendingRecords).toBe(0);
        });
    });
  });

  describe('GET /api/fallback/pending', () => {
    it('should return empty pending list', () => {
      return request(app.getHttpServer())
        .get('/api/fallback/pending')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('GET /api/fallback/events', () => {
    it('should return events list', () => {
      return request(app.getHttpServer())
        .get('/api/fallback/events')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ==========================================
  // Config API
  // ==========================================

  describe('GET /api/config', () => {
    it('should return full config', () => {
      return request(app.getHttpServer())
        .get('/api/config')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('sims');
          expect(res.body).toHaveProperty('centers');
          expect(res.body).toHaveProperty('protocol');
          expect(res.body).toHaveProperty('sync');
        });
    });
  });

  describe('PUT /api/config', () => {
    it('should update config', () => {
      return request(app.getHttpServer())
        .put('/api/config')
        .send({ sims: { heartbeatIntervalMs: 5000 } })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.sims.heartbeatIntervalMs).toBe(5000);
        });
    });
  });

  describe('GET /api/config/centers', () => {
    it('should return active centers', () => {
      return request(app.getHttpServer())
        .get('/api/config/centers')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(5);
        });
    });
  });

  describe('GET /api/config/sims', () => {
    it('should return SIMS config', () => {
      return request(app.getHttpServer())
        .get('/api/config/sims')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('host');
          expect(res.body).toHaveProperty('port');
        });
    });
  });

  // ==========================================
  // FTP API
  // ==========================================

  describe('GET /api/ftp/status', () => {
    it('should return FTP transfer status', () => {
      return request(app.getHttpServer())
        .get('/api/ftp/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('active');
          expect(res.body).toHaveProperty('completed');
          expect(res.body).toHaveProperty('failed');
        });
    });
  });

  describe('GET /api/ftp/active', () => {
    it('should return empty active transfers', () => {
      return request(app.getHttpServer())
        .get('/api/ftp/active')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
