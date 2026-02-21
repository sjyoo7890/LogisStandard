# Phase 10: 배포 및 운영 환경 구성

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
프로덕션 배포 및 운영 환경을 구성해줘.

[Docker 이미지]
각 앱별 최적화된 Docker 이미지 (multi-stage build):
- central-relay
- local-relay  
- standard-sw
- web-dashboard
- plc-simulator

[Docker Compose 프로파일]
1. development: 전체 스택 로컬 실행
2. testing: 테스트 환경 (PLC 시뮬레이터 포함)
3. staging: 실증화 환경 (실제 PLC 연결)
4. production: 운영 환경

[모니터링]
- Prometheus: 메트릭 수집 (처리량, 응답시간, 에러율, 연결 상태)
- Grafana: 대시보드 (사전 구성된 패널)
  * 시스템 개요 (CPU, 메모리, 네트워크)
  * 구분기 성능 (시간당 처리량, 구분 성공률)
  * 통신 상태 (PLC 연결, SIMS 연결, 전문 송수신)
  * 알람 현황

[로깅]
- 구조화 로깅 (JSON format)
- 로그 레벨: ERROR, WARN, INFO, DEBUG
- 로그 로테이션 (일별, 60일 보존)

[환경 변수]
- 집중국별 설정 (DB 접속, PLC 주소, SIMS 연결 등)
- 보안 설정 (DB 비밀번호, JWT 시크릿 등)

[헬스체크]
각 서비스의 /health 엔드포인트:
- DB 연결 상태
- Redis 연결 상태
- PLC 연결 상태 (local-relay)
- SIMS 연결 상태 (central-relay)

README.md에 설치/실행/배포 가이드를 작성해줘.
```
