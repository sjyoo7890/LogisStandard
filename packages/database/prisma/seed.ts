import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================================
  // 1) 모델 정의 테이블 시드
  // ============================================================================

  // 구분기 모델 Master
  const machines = await Promise.all([
    prisma.tbModelMachineMt.upsert({
      where: { machineId: 'PSM001' },
      update: {},
      create: {
        machineId: 'PSM001',
        machineType: 'P',
        machineName: '소포구분기1호기',
        machineBaseTime: '0600',
        machineDesc: '서울집중국 소포구분기 1호기',
        machineCenterName: '서울우편집중국',
        sortingMode: 'N',
        multiYn: 'Y',
      },
    }),
    prisma.tbModelMachineMt.upsert({
      where: { machineId: 'PSM002' },
      update: {},
      create: {
        machineId: 'PSM002',
        machineType: 'P',
        machineName: '소포구분기2호기',
        machineBaseTime: '0600',
        machineDesc: '서울집중국 소포구분기 2호기',
        machineCenterName: '서울우편집중국',
        sortingMode: 'C',
        multiYn: 'Y',
      },
    }),
    prisma.tbModelMachineMt.upsert({
      where: { machineId: 'CVY001' },
      update: {},
      create: {
        machineId: 'CVY001',
        machineType: 'C',
        machineName: '컨베이어1호기',
        machineBaseTime: '0600',
        machineDesc: '서울집중국 컨베이어',
        machineCenterName: '서울우편집중국',
        sortingMode: 'N',
        multiYn: 'N',
      },
    }),
  ]);
  console.log(`  - ${machines.length} machines created`);

  // 모듈 그룹 Master
  const groups = await Promise.all([
    prisma.tbModelGroupMt.upsert({
      where: { groupId: 'GRP_IND' },
      update: {},
      create: {
        groupId: 'GRP_IND',
        groupName: 'Induction 모듈 그룹',
        groupType: 'IN',
        groupDesc: '공급부 관련 모듈 그룹',
      },
    }),
    prisma.tbModelGroupMt.upsert({
      where: { groupId: 'GRP_SRT' },
      update: {},
      create: {
        groupId: 'GRP_SRT',
        groupName: 'Sorter 모듈 그룹',
        groupType: 'SR',
        groupDesc: '구분기 관련 모듈 그룹',
      },
    }),
    prisma.tbModelGroupMt.upsert({
      where: { groupId: 'GRP_CHT' },
      update: {},
      create: {
        groupId: 'GRP_CHT',
        groupName: 'Chute 모듈 그룹',
        groupType: 'CH',
        groupDesc: '구분구(슈트) 관련 모듈 그룹',
      },
    }),
    prisma.tbModelGroupMt.upsert({
      where: { groupId: 'GRP_SCN' },
      update: {},
      create: {
        groupId: 'GRP_SCN',
        groupName: 'Scanner 모듈 그룹',
        groupType: 'SC',
        groupDesc: '스캐너/OCR 관련 모듈 그룹',
      },
    }),
  ]);
  console.log(`  - ${groups.length} module groups created`);

  // 모듈 정의 Master
  const modules = await Promise.all([
    prisma.tbModelModuleMt.upsert({
      where: { moduleId: 'MOD_IND01' },
      update: {},
      create: {
        moduleId: 'MOD_IND01',
        groupId: 'GRP_IND',
        moduleName: 'Induction #1',
        moduleType: 'IN',
        moduleDesc: '1번 공급부',
      },
    }),
    prisma.tbModelModuleMt.upsert({
      where: { moduleId: 'MOD_IND02' },
      update: {},
      create: {
        moduleId: 'MOD_IND02',
        groupId: 'GRP_IND',
        moduleName: 'Induction #2',
        moduleType: 'IN',
        moduleDesc: '2번 공급부',
      },
    }),
    prisma.tbModelModuleMt.upsert({
      where: { moduleId: 'MOD_SRT01' },
      update: {},
      create: {
        moduleId: 'MOD_SRT01',
        groupId: 'GRP_SRT',
        moduleName: 'Sorter Main',
        moduleType: 'SR',
        moduleDesc: '메인 구분기',
      },
    }),
    prisma.tbModelModuleMt.upsert({
      where: { moduleId: 'MOD_SCN01' },
      update: {},
      create: {
        moduleId: 'MOD_SCN01',
        groupId: 'GRP_SCN',
        moduleName: 'Top Scanner',
        moduleType: 'SC',
        moduleDesc: '상면 스캐너',
      },
    }),
  ]);
  console.log(`  - ${modules.length} modules created`);

  // PC 모델 정의
  const pcModels = await Promise.all([
    prisma.tbModelPcMt.upsert({
      where: { pcId: 'PC_MC001' },
      update: {},
      create: {
        pcId: 'PC_MC001',
        machineId: 'PSM001',
        pcName: 'Main Controller PC',
        pcType: 'MC',
        ipAddress: '192.168.1.10',
        pcDesc: 'PSM001 메인 컨트롤러',
      },
    }),
    prisma.tbModelPcMt.upsert({
      where: { pcId: 'PC_SC001' },
      update: {},
      create: {
        pcId: 'PC_SC001',
        machineId: 'PSM001',
        pcName: 'Sub Controller PC',
        pcType: 'SC',
        ipAddress: '192.168.1.11',
        pcDesc: 'PSM001 서브 컨트롤러',
      },
    }),
    prisma.tbModelPcMt.upsert({
      where: { pcId: 'PC_DP001' },
      update: {},
      create: {
        pcId: 'PC_DP001',
        machineId: 'PSM001',
        pcName: 'Display PC',
        pcType: 'DP',
        ipAddress: '192.168.1.20',
        pcDesc: 'PSM001 현황판 PC',
      },
    }),
  ]);
  console.log(`  - ${pcModels.length} PC models created`);

  // ============================================================================
  // 2) 운영 테이블 시드
  // ============================================================================

  // 그룹코드 정의
  const groupCodes = await Promise.all([
    prisma.tbGroupCodeMt.upsert({
      where: { groupCode: 'RESULT' },
      update: {},
      create: {
        groupCode: 'RESULT',
        groupCodeName: '구분결과코드',
        groupCodeDesc: '소포 구분 결과 코드 그룹',
      },
    }),
    prisma.tbGroupCodeMt.upsert({
      where: { groupCode: 'CTYPE' },
      update: {},
      create: {
        groupCode: 'CTYPE',
        groupCodeName: '슈트유형코드',
        groupCodeDesc: '슈트 유형 분류 코드',
      },
    }),
    prisma.tbGroupCodeMt.upsert({
      where: { groupCode: 'REGION' },
      update: {},
      create: {
        groupCode: 'REGION',
        groupCodeName: '지역코드',
        groupCodeDesc: '전국 우편 권역 코드',
      },
    }),
    prisma.tbGroupCodeMt.upsert({
      where: { groupCode: 'MSTATE' },
      update: {},
      create: {
        groupCode: 'MSTATE',
        groupCodeName: '장비상태코드',
        groupCodeDesc: '장비 상태 분류 코드',
      },
    }),
  ]);
  console.log(`  - ${groupCodes.length} group codes created`);

  // 구분코드 정의
  const sortCodes = await Promise.all([
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'RESULT', sortCode: 'OK' } },
      update: {},
      create: { groupCode: 'RESULT', sortCode: 'OK', sortCodeName: '정상구분', sortOrder: 1 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'RESULT', sortCode: 'NR' } },
      update: {},
      create: { groupCode: 'RESULT', sortCode: 'NR', sortCodeName: '미인식', sortOrder: 2 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'RESULT', sortCode: 'NM' } },
      update: {},
      create: { groupCode: 'RESULT', sortCode: 'NM', sortCodeName: '미매칭', sortOrder: 3 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'RESULT', sortCode: 'RJ' } },
      update: {},
      create: { groupCode: 'RESULT', sortCode: 'RJ', sortCodeName: '리젝트', sortOrder: 4 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'CTYPE', sortCode: 'N' } },
      update: {},
      create: { groupCode: 'CTYPE', sortCode: 'N', sortCodeName: '일반슈트', sortOrder: 1 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'CTYPE', sortCode: 'R' } },
      update: {},
      create: { groupCode: 'CTYPE', sortCode: 'R', sortCodeName: '리젝트슈트', sortOrder: 2 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'CTYPE', sortCode: 'O' } },
      update: {},
      create: { groupCode: 'CTYPE', sortCode: 'O', sortCodeName: '오버플로슈트', sortOrder: 3 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'REGION', sortCode: '01' } },
      update: {},
      create: { groupCode: 'REGION', sortCode: '01', sortCodeName: '서울', sortOrder: 1 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'REGION', sortCode: '02' } },
      update: {},
      create: { groupCode: 'REGION', sortCode: '02', sortCodeName: '경기', sortOrder: 2 },
    }),
    prisma.tbSortCodeMt.upsert({
      where: { groupCode_sortCode: { groupCode: 'REGION', sortCode: '03' } },
      update: {},
      create: { groupCode: 'REGION', sortCode: '03', sortCodeName: '인천', sortOrder: 3 },
    }),
  ]);
  console.log(`  - ${sortCodes.length} sort codes created`);

  // 우체국코드 정의
  const officeCodes = await Promise.all([
    prisma.tbOfficeCodeMt.upsert({
      where: { officeCode: '110101' },
      update: {},
      create: {
        officeCode: '110101',
        officeName: '서울우편집중국',
        officeType: 'C',
        regionCode: '01',
        regionName: '서울',
        zipCode: '04509',
      },
    }),
    prisma.tbOfficeCodeMt.upsert({
      where: { officeCode: '410101' },
      update: {},
      create: {
        officeCode: '410101',
        officeName: '경기우편집중국',
        officeType: 'C',
        regionCode: '02',
        regionName: '경기',
        zipCode: '16503',
      },
    }),
    prisma.tbOfficeCodeMt.upsert({
      where: { officeCode: '300101' },
      update: {},
      create: {
        officeCode: '300101',
        officeName: '대전우편집중국',
        officeType: 'C',
        regionCode: '04',
        regionName: '대전',
        zipCode: '34914',
      },
    }),
    prisma.tbOfficeCodeMt.upsert({
      where: { officeCode: '100001' },
      update: {},
      create: {
        officeCode: '100001',
        officeName: '종로우체국',
        officeType: 'O',
        regionCode: '01',
        regionName: '서울',
        zipCode: '03154',
      },
    }),
  ]);
  console.log(`  - ${officeCodes.length} office codes created`);

  // 위탁 크기 정의
  const entrustSizes = await Promise.all([
    prisma.tbOperEntrustSizeMt.upsert({
      where: { sizeId: 'SIZE_S' },
      update: {},
      create: {
        sizeId: 'SIZE_S',
        sizeName: '소형',
        minLength: 100, maxLength: 350,
        minWidth: 70, maxWidth: 250,
        minHeight: 10, maxHeight: 100,
        minWeight: 50, maxWeight: 2000,
        sizeDesc: '소형 소포 (2kg 이하)',
      },
    }),
    prisma.tbOperEntrustSizeMt.upsert({
      where: { sizeId: 'SIZE_M' },
      update: {},
      create: {
        sizeId: 'SIZE_M',
        sizeName: '중형',
        minLength: 200, maxLength: 600,
        minWidth: 150, maxWidth: 400,
        minHeight: 50, maxHeight: 300,
        minWeight: 500, maxWeight: 10000,
        sizeDesc: '중형 소포 (10kg 이하)',
      },
    }),
    prisma.tbOperEntrustSizeMt.upsert({
      where: { sizeId: 'SIZE_L' },
      update: {},
      create: {
        sizeId: 'SIZE_L',
        sizeName: '대형',
        minLength: 400, maxLength: 1000,
        minWidth: 300, maxWidth: 600,
        minHeight: 200, maxHeight: 500,
        minWeight: 2000, maxWeight: 30000,
        sizeDesc: '대형 소포 (30kg 이하)',
      },
    }),
  ]);
  console.log(`  - ${entrustSizes.length} entrust sizes created`);

  // 구분계획 Master
  const plans = await Promise.all([
    prisma.tbOperSortingPlanMt.upsert({
      where: { planId: 'PLAN_PSM001_001' },
      update: {},
      create: {
        planId: 'PLAN_PSM001_001',
        machineId: 'PSM001',
        planName: '서울 1호기 주간계획',
        planType: 'DY',
        planDate: '20260218',
        planTime: '060000',
        planStatus: 'A',
        totalChute: 100,
        description: '서울집중국 1호기 주간 구분계획',
      },
    }),
  ]);
  console.log(`  - ${plans.length} sorting plans created`);

  // 구분계획 상세 (10개 슈트)
  const planDetails = [];
  const destinations = [
    { chuteNo: 1, sortCode: '01000', destName: '서울 종로', destCode: '01' },
    { chuteNo: 2, sortCode: '02000', destName: '서울 중구', destCode: '01' },
    { chuteNo: 3, sortCode: '03000', destName: '서울 용산', destCode: '01' },
    { chuteNo: 4, sortCode: '10000', destName: '경기 수원', destCode: '02' },
    { chuteNo: 5, sortCode: '11000', destName: '경기 성남', destCode: '02' },
    { chuteNo: 6, sortCode: '20000', destName: '인천 남동', destCode: '03' },
    { chuteNo: 7, sortCode: '30000', destName: '대전 서구', destCode: '04' },
    { chuteNo: 8, sortCode: '40000', destName: '대구 중구', destCode: '05' },
    { chuteNo: 9, sortCode: '50000', destName: '부산 중구', destCode: '06' },
    { chuteNo: 10, sortCode: '60000', destName: '광주 동구', destCode: '07' },
  ];
  for (const dest of destinations) {
    planDetails.push(
      prisma.tbOperSortingPlanDt.create({
        data: {
          planId: 'PLAN_PSM001_001',
          chuteNo: dest.chuteNo,
          sortCode: dest.sortCode,
          destName: dest.destName,
          destCode: dest.destCode,
          sortOrder: dest.chuteNo,
        },
      })
    );
  }
  await Promise.all(planDetails);
  console.log(`  - ${planDetails.length} plan details created`);

  // ============================================================================
  // 3) CGS(HMI) Alarm 정의
  // ============================================================================

  const alarms = await Promise.all([
    prisma.tbHmiAlarmMt.upsert({
      where: { alarmCode: 'ALM_E001' },
      update: {},
      create: {
        alarmCode: 'ALM_E001',
        alarmName: '비상정지 버튼 작동',
        alarmLevel: 'C',
        alarmGroup: 'SAFETY',
        alarmDesc: '비상정지 버튼이 눌렸습니다',
        autoResetYn: 'N',
      },
    }),
    prisma.tbHmiAlarmMt.upsert({
      where: { alarmCode: 'ALM_E002' },
      update: {},
      create: {
        alarmCode: 'ALM_E002',
        alarmName: '모터 과부하',
        alarmLevel: 'C',
        alarmGroup: 'MOTOR',
        alarmDesc: '구분기 메인 모터 과부하 발생',
        autoResetYn: 'N',
      },
    }),
    prisma.tbHmiAlarmMt.upsert({
      where: { alarmCode: 'ALM_W001' },
      update: {},
      create: {
        alarmCode: 'ALM_W001',
        alarmName: '슈트 만재 경고',
        alarmLevel: 'W',
        alarmGroup: 'CHUTE',
        alarmDesc: '슈트 적재량이 임계값을 초과',
        autoResetYn: 'Y',
      },
    }),
    prisma.tbHmiAlarmMt.upsert({
      where: { alarmCode: 'ALM_W002' },
      update: {},
      create: {
        alarmCode: 'ALM_W002',
        alarmName: '바코드 인식률 저하',
        alarmLevel: 'W',
        alarmGroup: 'SCANNER',
        alarmDesc: '바코드 인식률이 설정값 이하',
        autoResetYn: 'Y',
      },
    }),
    prisma.tbHmiAlarmMt.upsert({
      where: { alarmCode: 'ALM_I001' },
      update: {},
      create: {
        alarmCode: 'ALM_I001',
        alarmName: '구분작업 시작',
        alarmLevel: 'I',
        alarmGroup: 'OPERATION',
        alarmDesc: '구분 작업이 시작되었습니다',
        autoResetYn: 'Y',
      },
    }),
  ]);
  console.log(`  - ${alarms.length} HMI alarms created`);

  // ============================================================================
  // 슈트현황판 행선지 시드
  // ============================================================================

  const chuteManagement = [];
  for (const dest of destinations) {
    chuteManagement.push(
      prisma.tbOperChuteManagementDt.upsert({
        where: {
          machineId_chuteNo: { machineId: 'PSM001', chuteNo: dest.chuteNo },
        },
        update: {},
        create: {
          machineId: 'PSM001',
          chuteNo: dest.chuteNo,
          chuteType: 'N',
          destName: dest.destName,
          destCode: dest.destCode,
          chuteStatus: 'N',
          itemCount: 0,
        },
      })
    );
  }
  // 리젝트 슈트
  chuteManagement.push(
    prisma.tbOperChuteManagementDt.upsert({
      where: { machineId_chuteNo: { machineId: 'PSM001', chuteNo: 99 } },
      update: {},
      create: {
        machineId: 'PSM001',
        chuteNo: 99,
        chuteType: 'R',
        destName: '리젝트',
        chuteStatus: 'N',
        itemCount: 0,
      },
    })
  );
  // 오버플로 슈트
  chuteManagement.push(
    prisma.tbOperChuteManagementDt.upsert({
      where: { machineId_chuteNo: { machineId: 'PSM001', chuteNo: 100 } },
      update: {},
      create: {
        machineId: 'PSM001',
        chuteNo: 100,
        chuteType: 'O',
        destName: '오버플로',
        chuteStatus: 'N',
        itemCount: 0,
      },
    })
  );
  await Promise.all(chuteManagement);
  console.log(`  - ${chuteManagement.length} chute entries created`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
