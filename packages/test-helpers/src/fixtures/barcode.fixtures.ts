/**
 * 바코드 테스트 픽스처
 */
export const BarcodeFixtures = {
  /** 정상 바코드 - 서울 */
  validSeoul: {
    barcode: '4210012345678',
    zipCode: '42100',
    destination: 'CHUTE-01',
    type: 'CODE128' as const,
  },
  /** 정상 바코드 - 부산 */
  validBusan: {
    barcode: '4810098765432',
    zipCode: '48100',
    destination: 'CHUTE-05',
    type: 'CODE128' as const,
  },
  /** 정상 바코드 - 대전 */
  validDaejeon: {
    barcode: '3410055512345',
    zipCode: '34100',
    destination: 'CHUTE-03',
    type: 'EAN128' as const,
  },
  /** QR 코드 바코드 */
  validQR: {
    barcode: 'QR20260219001',
    zipCode: '06100',
    destination: 'CHUTE-10',
    type: 'QR' as const,
  },
  /** 판독 불가 바코드 */
  noRead: {
    barcode: '',
    zipCode: '',
    destination: '',
    type: 'NO_READ' as const,
  },
  /** 다중 판독 바코드 */
  multiRead: {
    barcode: 'MULTI_4210012345678_4810098765432',
    zipCode: '',
    destination: '',
    type: 'MULTI_READ' as const,
  },
  /** 손상된 바코드 */
  damaged: {
    barcode: '421XX',
    zipCode: '',
    destination: '',
    type: 'ERROR' as const,
  },
  /** 알 수 없는 우편번호 */
  unknownZip: {
    barcode: '9999912345678',
    zipCode: '99999',
    destination: 'REJECT',
    type: 'CODE128' as const,
  },

  /** 바코드 읽기 결과 목록 생성 */
  generateReadResults(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `READ-${String(i + 1).padStart(4, '0')}`,
      barcode: `421${String(i).padStart(10, '0')}`,
      zipCode: '42100',
      inductionId: `IND-${(i % 4) + 1}`,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      status: i % 10 === 0 ? 'NO_READ' : 'SUCCESS',
    }));
  },

  /** IPS 디바이스 픽스처 */
  ipsDevices: [
    { id: 'IPS-IND1', name: 'Induction 1 BCR', status: 'ONLINE', type: 'IPS' },
    { id: 'IPS-IND2', name: 'Induction 2 BCR', status: 'ONLINE', type: 'IPS' },
    { id: 'IPS-IND3', name: 'Induction 3 BCR', status: 'OFFLINE', type: 'IPS' },
    { id: 'IPS-IND4', name: 'Induction 4 BCR', status: 'ONLINE', type: 'IPS' },
  ],
};
