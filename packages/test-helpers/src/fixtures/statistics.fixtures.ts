/**
 * 통계 테스트 픽스처
 */
export const StatisticsFixtures = {
  /** 일별 통계 요약 */
  dailySummary: {
    date: '2026-02-19',
    totalProcessed: 15000,
    totalSuccess: 14250,
    totalReject: 450,
    totalNoRead: 300,
    successRate: 95.0,
    avgProcessingTime: 1.2,
  },

  /** 인덕션별 통계 */
  inductionStats: [
    { inductionId: 'IND-1', processed: 4000, success: 3850, noRead: 100, reject: 50 },
    { inductionId: 'IND-2', processed: 3800, success: 3600, noRead: 120, reject: 80 },
    { inductionId: 'IND-3', processed: 3700, success: 3500, noRead: 50, reject: 150 },
    { inductionId: 'IND-4', processed: 3500, success: 3300, noRead: 30, reject: 170 },
  ],

  /** 슈트별 통계 */
  chuteStats: Array.from({ length: 20 }, (_, i) => ({
    chuteId: `CHUTE-${String(i + 1).padStart(2, '0')}`,
    count: Math.floor(Math.random() * 800) + 200,
    fillRate: Math.random() * 0.8 + 0.1,
  })),

  /** 우편번호별 통계 */
  codeStats: [
    { zipPrefix: '42', count: 3000, destination: 'CHUTE-01' },
    { zipPrefix: '48', count: 2500, destination: 'CHUTE-05' },
    { zipPrefix: '34', count: 2000, destination: 'CHUTE-03' },
    { zipPrefix: '06', count: 1800, destination: 'CHUTE-10' },
    { zipPrefix: '13', count: 1500, destination: 'CHUTE-07' },
  ],

  /** CSV 내보내기 기대 헤더 */
  csvHeaders: ['date', 'totalProcessed', 'totalSuccess', 'totalReject', 'totalNoRead', 'successRate'],

  /** 날짜 범위 필터 */
  dateRange: {
    startDate: '2026-02-17',
    endDate: '2026-02-19',
  },

  /** 체결정보 */
  bindingInfo: {
    id: 'BIND-001',
    sortingDate: '2026-02-19',
    totalItems: 500,
    completedItems: 480,
    status: 'COMPLETED' as const,
    simsTransferred: true,
  },

  /** 체결 전송 실패 */
  bindingFailed: {
    id: 'BIND-002',
    sortingDate: '2026-02-19',
    totalItems: 300,
    completedItems: 300,
    status: 'COMPLETED' as const,
    simsTransferred: false,
    csvGenerated: true,
    csvPath: '/data/fallback/binding_20260219_001.csv',
  },
};
