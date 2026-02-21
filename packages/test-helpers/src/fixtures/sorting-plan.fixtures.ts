/**
 * 구분계획 테스트 픽스처
 */
export const SortingPlanFixtures = {
  /** 활성 구분계획 */
  activePlan: {
    id: 'PLAN-001',
    name: '서울중앙 소포 구분계획',
    status: 'ACTIVE' as const,
    createdAt: '2026-02-19T00:00:00Z',
    rules: [
      { id: 'RULE-01', zipPrefix: '42', destination: 'CHUTE-01', priority: 1 },
      { id: 'RULE-02', zipPrefix: '48', destination: 'CHUTE-05', priority: 2 },
      { id: 'RULE-03', zipPrefix: '34', destination: 'CHUTE-03', priority: 3 },
      { id: 'RULE-04', zipPrefix: '06', destination: 'CHUTE-10', priority: 4 },
      { id: 'RULE-05', zipPrefix: '13', destination: 'CHUTE-07', priority: 5 },
    ],
  },

  /** 초안 구분계획 */
  draftPlan: {
    id: 'PLAN-002',
    name: '신규 구분계획 초안',
    status: 'DRAFT' as const,
    createdAt: '2026-02-18T00:00:00Z',
    rules: [
      { id: 'RULE-11', zipPrefix: '42', destination: 'CHUTE-02', priority: 1 },
      { id: 'RULE-12', zipPrefix: '48', destination: 'CHUTE-06', priority: 2 },
    ],
  },

  /** 보관 구분계획 */
  archivedPlan: {
    id: 'PLAN-003',
    name: '이전 구분계획',
    status: 'ARCHIVED' as const,
    createdAt: '2026-02-01T00:00:00Z',
    rules: [],
  },

  /** 구분계획 생성 DTO */
  createPlanDto: {
    name: '테스트 구분계획',
    rules: [
      { zipPrefix: '42', destination: 'CHUTE-01', priority: 1 },
      { zipPrefix: '48', destination: 'CHUTE-05', priority: 2 },
    ],
  },

  /** 슈트 매핑 */
  chuteMappings: Array.from({ length: 20 }, (_, i) => ({
    chuteId: `CHUTE-${String(i + 1).padStart(2, '0')}`,
    destination: `DEST-${String(i + 1).padStart(2, '0')}`,
    label: `목적지 ${i + 1}`,
    capacity: 200,
  })),

  /** 정상 구분 이벤트 */
  sortEvent: {
    id: 'SORT-001',
    barcode: '4210012345678',
    zipCode: '42100',
    destination: 'CHUTE-01',
    inductionId: 'IND-1',
    result: 'SUCCESS' as const,
    timestamp: new Date().toISOString(),
  },

  /** 리젝트 구분 이벤트 */
  rejectEvent: {
    id: 'SORT-002',
    barcode: '9999912345678',
    zipCode: '99999',
    destination: 'REJECT',
    inductionId: 'IND-2',
    result: 'REJECT' as const,
    timestamp: new Date().toISOString(),
  },
};
