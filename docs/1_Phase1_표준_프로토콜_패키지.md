# Phase 1: 표준 프로토콜 패키지 (packages/protocol)

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
packages/protocol 패키지를 구현해줘.
이 패키지는 우편물자동구분기의 상위단(중앙)과 하위단(로컬) 표준 인터페이스 프로토콜을 정의한다.

[1. 상위단(중앙) 인터페이스 프로토콜]

SIMS/KPLAS와 구분관리시스템 간 데이터 연계 프로토콜을 정의해:

// 연계 방식별 인터페이스
interface CentralProtocol {
  // DB2DB 연계
  db2db: {
    // SIMS → 구분기 (수신)
    inbound: {
      receptionInfo: ReceptionInfo;        // 접수정보 (소포, 등기통상)
      addressRouteDB: AddressRouteDB;      // 주소 및 순로DB (집배순로)
    };
    // 구분기 → SIMS (송신)
    outbound: {
      sortingResult: SortingResultInfo;    // 구분결과정보 (소포)
      bindingInfo: BindingInfo;            // 체결정보 (등기통상)
      statisticsInfo: StatisticsInfo;      // 통계정보 (모든 자동화설비)
    };
  };
  // FTP 연계
  ftp: {
    // KPLAS → 소형통상구분기
    deliveryAddressDB: DeliveryAddressDBFile;  // 배달점주소DB파일
    mlfFile: MLFFile;                          // MLF파일 (또는 주소DB파일)
    sortingPlan: SortingPlanFile;              // 구분계획
  };
  // 소켓통신 연계
  socket: {
    // PDA ↔ 소포체결 수작업시스템
    labelBarcode: LabelBarcodeInfo;       // 국명표바코드
    containerNumber: ContainerNumberInfo;  // 용기번호
    registeredBarcode: RegisteredBarcodeInfo; // 등기바코드
    bindingConfirm: BindingConfirmInfo;   // 체결확인
    sortingZoneInfo: SortingZoneInfo;     // 구분구정보
  };
}

각 인터페이스의 상세 타입을 정의하고, 직렬화/역직렬화 유틸리티를 구현해줘.
DB2DB 동기화를 위한 변경감지(CDC) 메커니즘도 포함해.
SIMS 장애 시 CSV 파일로 Post-Net에 직접 등록할 수 있는 Fallback 메커니즘도 구현해.

[2. 하위단(로컬) 인터페이스 프로토콜]

구분관리시스템과 PLC/IPS/OCR 등 H/W 장비 간 TCP/IP 소켓통신 프로토콜:

// 장비 유형별 프로토콜
interface LocalProtocol {
  plc: PLCProtocol;          // PLC 제어 전문
  ips: IPSProtocol;          // IPS(BCR) 바코드 판독
  ocr: OCRProtocol;          // OCR 주소 인식
  scada: SCADAProtocol;      // SCADA 상태 모니터링
  display: DisplayProtocol;  // 현황판 (슈트/구분칸/상황관제/작업)
  conveyor: ConveyorProtocol; // C/V PLC
}

프로토콜은 설비 유형에 따라 두 가지 프로파일로 구분해:
- Profile A (소포/대형통상구분기): IPS 바코드 기반, 타건기 지원, 슈트현황판, 상황관제
- Profile B (소형통상/집배순로구분기): OCR/IMS 기반, MLF파일 지원, 구분칸현황판, 작업현황판(OP패널), 상자적재대 PLC

모든 프로토콜에 대해:
- TypeScript 인터페이스 및 Zod 스키마 정의
- 바이너리 직렬화/역직렬화 (Buffer 기반)
- 프로토콜 버전 관리
- 에러 코드 정의
```
