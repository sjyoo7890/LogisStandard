import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Standard SW (e2e)', () => {
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
          expect(res.body.service).toBe('standard-sw');
          expect(res.body.version).toBe('0.1.0');
        });
    });
  });

  describe('GET /api/status', () => {
    it('should return full system status', () => {
      return request(app.getHttpServer())
        .get('/api/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('system');
          expect(res.body).toHaveProperty('infoLink');
          expect(res.body).toHaveProperty('sorting');
          expect(res.body).toHaveProperty('statistics');
          expect(res.body).toHaveProperty('monitoring');
          expect(res.body).toHaveProperty('keying');
          expect(res.body).toHaveProperty('chuteDisplay');
          expect(res.body).toHaveProperty('situation');
        });
    });
  });

  // ==========================================
  // InfoLink API
  // ==========================================

  describe('GET /api/info-link/status', () => {
    it('should return info-link status', () => {
      return request(app.getHttpServer())
        .get('/api/info-link/status')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.totalRecords).toBe(20);
        });
    });
  });

  describe('GET /api/info-link/data', () => {
    it('should return 20 sorting data records', () => {
      return request(app.getHttpServer())
        .get('/api/info-link/data')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(20);
        });
    });
  });

  describe('GET /api/info-link/lookup/:zipCode', () => {
    it('should lookup destination by zip code', () => {
      return request(app.getHttpServer())
        .get('/api/info-link/lookup/01000')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.found).toBe(true);
        });
    });
  });

  // ==========================================
  // Sorting API
  // ==========================================

  describe('GET /api/sorting/plans', () => {
    it('should return sorting plans', () => {
      return request(app.getHttpServer())
        .get('/api/sorting/plans')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });
  });

  describe('POST /api/sorting/process', () => {
    it('should process a barcode', () => {
      return request(app.getHttpServer())
        .post('/api/sorting/process')
        .send({ barcode: '4201234567890' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('barcode');
          expect(res.body).toHaveProperty('result');
          expect(res.body.barcode).toBe('4201234567890');
        });
    });
  });

  describe('GET /api/sorting/special-keys', () => {
    it('should return special keys', () => {
      return request(app.getHttpServer())
        .get('/api/sorting/special-keys')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(3);
        });
    });
  });

  // ==========================================
  // Statistics API
  // ==========================================

  describe('GET /api/statistics/summary', () => {
    it('should return daily summary', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/summary')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(3);
        });
    });
  });

  describe('GET /api/statistics/chute', () => {
    it('should return chute statistics', () => {
      return request(app.getHttpServer())
        .get('/api/statistics/chute')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(60);
        });
    });
  });

  // ==========================================
  // Monitoring API
  // ==========================================

  describe('GET /api/monitoring/layout', () => {
    it('should return sorter layout', () => {
      return request(app.getHttpServer())
        .get('/api/monitoring/layout')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('tracks');
          expect(res.body).toHaveProperty('inductions');
          expect(res.body).toHaveProperty('chutes');
          expect(res.body.chutes.length).toBe(20);
        });
    });
  });

  describe('GET /api/monitoring/alarms', () => {
    it('should return alarms', () => {
      return request(app.getHttpServer())
        .get('/api/monitoring/alarms')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('GET /api/monitoring/comm-status', () => {
    it('should return comm statuses', () => {
      return request(app.getHttpServer())
        .get('/api/monitoring/comm-status')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(4);
        });
    });
  });

  // ==========================================
  // Keying API
  // ==========================================

  describe('GET /api/keying/stations', () => {
    it('should return keying stations', () => {
      return request(app.getHttpServer())
        .get('/api/keying/stations')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });
  });

  describe('POST /api/keying/requests', () => {
    it('should create a keying request', () => {
      return request(app.getHttpServer())
        .post('/api/keying/requests')
        .send({ barcode: '4299999000000', stationId: 'KST-01' })
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('DISPLAYED');
        });
    });
  });

  // ==========================================
  // ChuteDisplay API
  // ==========================================

  describe('GET /api/chute-display', () => {
    it('should return all chute displays', () => {
      return request(app.getHttpServer())
        .get('/api/chute-display')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(20);
        });
    });
  });

  describe('GET /api/chute-display/summary', () => {
    it('should return display summary', () => {
      return request(app.getHttpServer())
        .get('/api/chute-display/summary')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.totalChutes).toBe(20);
        });
    });
  });

  // ==========================================
  // Situation API
  // ==========================================

  describe('GET /api/situation/overview', () => {
    it('should return overview', () => {
      return request(app.getHttpServer())
        .get('/api/situation/overview')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalProcessed');
          expect(res.body).toHaveProperty('successRate');
          expect(res.body).toHaveProperty('uptimeMinutes');
        });
    });
  });

  describe('GET /api/situation/delivery-points', () => {
    it('should return 5 delivery points', () => {
      return request(app.getHttpServer())
        .get('/api/situation/delivery-points')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(5);
        });
    });
  });

  describe('GET /api/situation/sorter-status', () => {
    it('should return sorter statuses', () => {
      return request(app.getHttpServer())
        .get('/api/situation/sorter-status')
        .expect(200)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
        });
    });
  });

  // ==========================================
  // Additional cross-module tests
  // ==========================================

  describe('POST /api/info-link/sync', () => {
    it('should sync SIMS data', () => {
      return request(app.getHttpServer())
        .post('/api/info-link/sync?system=SIMS')
        .expect(201)
        .expect((res: any) => {
          expect(res.body.system).toBe('SIMS');
          expect(res.body.status).toBe('SUCCESS');
          expect(res.body.recordsSynced).toBe(150);
        });
    });
  });

  describe('GET /api/sorting/stats', () => {
    it('should return sorting statistics', () => {
      return request(app.getHttpServer())
        .get('/api/sorting/stats')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('totalProcessed');
          expect(res.body).toHaveProperty('successRate');
        });
    });
  });
});
