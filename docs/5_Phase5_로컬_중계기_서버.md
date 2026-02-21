# Phase 5: 로컬 중계기 서버 (apps/local-relay)

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
apps/local-relay를 NestJS 기반으로 구현해줘.
로컬 중계기는 각 집중국의 상위SW와 H/W 장비(PLC) 사이에서 데이터를 중계하는 서버이다.

[핵심 모듈]

1. PLCConnectionModule (PLC 소켓통신):
   - TCP/IP 소켓 서버/클라이언트 (포트별 채널 관리)
   - packages/telegram 패키지를 사용한 전문 파싱/빌딩
   - HeartBeat 기반 연결 상태 관리
   - 자동 재연결 및 버퍼 관리
   - 포트 구성:
     * Send: 3003(Destination), 3011(MCS), 3001(Heartbeat)
     * Receive: 3000(Discharge), 3004(Confirm), 3010(MCS), 3006(Induct)

2. IPSModule (IPS/BCR 연계):
   - 바코드 판독 정보 수신
   - 우편물ID, 트리거 정보 처리
   - IPS 상태/알람 정보 모니터링

3. EquipmentMonitorModule (장비 상태 모니터링):
   - PLC 상태정보, 알람정보 수집
   - IPS/OCR 상태 정보
   - C/V PLC 상태정보
   - 상자적재대 PLC 상태정보 (소형통상/집배순로)
   - 장비 상태 변경 이벤트 발행

4. SimulatorModule (시뮬레이터 모드):
   - H/W 장비 연결 없이 표준 인터페이스 검증용
   - 가상 PLC 에뮬레이션 (모든 Telegram 응답 시뮬레이션)
   - 홀수/짝수/나눗셈 등의 구분규칙으로 실물 구분 테스트
   - 에뮬레이터에서 코드/데이터/제한시간의 기준값과 실제값 비교 검증
   - 수치/그래프 등 비교 분석 이상여부 확인

5. OperationModule (운영 모드):
   - 시뮬레이터 모드 ↔ 운영 모드 전환
   - 운영 모드에서 실제 H/W 장비와 통신
   - 모드 전환 시 안전 검증 절차

6. TestModule (테스트 기능):
   - 상위시스템 SW의 역할을 중계기가 대신하여 H/W 장비 직접 테스트
   - 실물 우편물 투입 → 구분결과 실시간 확인
   - 인터페이스 프로토콜 준수 여부 검증
   - 테스트 리포트 생성

7. MaintenanceModule (유지보수 기능):
   - 중계기 제거 후 배장비의 상위시스템 SW 연결 테스트
   - H/W 장비 정상작동 여부 확인
   - 유지보수 검사 기능

[API 및 WebSocket]
- GET /api/status - 전체 장비 상태
- GET /api/plc/status - PLC 연결 상태 및 전문 통계
- GET /api/equipment - 장비별 상세 상태
- GET /api/logs/comm - 통신 로그
- POST /api/mode/switch - 시뮬레이터/운영 모드 전환
- POST /api/test/start - 테스트 실행
- GET /api/test/report/:id - 테스트 리포트 조회
- PUT /api/config/equipment - 장비 설정
- PUT /api/config/comm - 통신 설정
- /ws/plc-stream - PLC 전문 실시간 스트림
- /ws/equipment-status - 장비 상태 실시간 스트림
- /ws/alarms - 알람 실시간 스트림

모든 모듈에 대한 테스트를 작성해줘.
```
