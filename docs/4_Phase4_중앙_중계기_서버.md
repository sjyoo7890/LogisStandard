# Phase 4: 중앙 중계기 서버 (apps/central-relay)

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
apps/central-relay를 NestJS 기반으로 구현해줘.
중앙 중계기는 우정사업정보센터의 SIMS와 각 집중국의 상위SW 사이에서 데이터를 중계하는 서버이다.

[핵심 모듈]

1. ConnectionModule (통신상태 관리):
   - SIMS와의 DB2DB 연결 상태 모니터링
   - 각 집중국 상위SW와의 연결 상태 모니터링
   - 연결 실패 시 자동 재연결 (exponential backoff)
   - 통신상태 대시보드 API

2. DataSyncModule (데이터 동기화):
   - SIMS → 각 집중국: 접수정보, 주소/순로DB 동기화
   - 각 집중국 → SIMS: 구분결과, 체결정보, 통계정보 동기화
   - 변경 감지 기반 증분 동기화
   - 동기화 충돌 해결 전략 (last-write-wins + 로그)
   - 트랜잭션 기반 일관성 보장

3. FTPModule (파일 전송):
   - KPLAS → 소형통상구분기: 배달점주소DB, MLF파일 전송
   - 구분계획 파일 배포
   - 파일 전송 상태 추적 및 재전송

4. FallbackModule (장애 대응):
   - SIMS 장애 감지 (HeartBeat 기반)
   - 장애 시 CSV 파일 자동 생성 (체결정보 → Post-Net 직접 등록용)
   - 장애 복구 후 미전송 데이터 자동 동기화

5. LogModule (통신 로그):
   - 모든 송수신 데이터 로깅
   - 로그 검색/필터링 API
   - 로그 보존 기간 관리 (60일)

6. ConfigModule (설정 관리):
   - 집중국별 연결 설정 (서울, 부산, 대구, 광주, 대전)
   - 통신 프로토콜 설정
   - 동기화 주기 설정

[API 엔드포인트]
- GET /api/status - 전체 시스템 상태
- GET /api/connections - 각 집중국 연결 상태
- GET /api/logs - 통신 로그 조회 (필터: 날짜, 집중국, 방향)
- POST /api/sync/trigger - 수동 동기화 트리거
- GET /api/sync/history - 동기화 이력
- PUT /api/config - 설정 변경
- GET /api/fallback/status - Fallback 상태 및 미전송 목록

WebSocket 엔드포인트:
- /ws/status - 실시간 통신상태 스트림
- /ws/logs - 실시간 로그 스트림

각 모듈에 대한 단위/통합 테스트를 작성해줘.
```
