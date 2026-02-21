# Phase 0: 프로젝트 초기화 및 기술 스택 설정

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
우정사업본부 자동화설비 표준 인터페이스 통합플랫폼 프로젝트를 초기화해줘.

프로젝트명: kpost-automation-platform
모노레포 구조로 구성하고, 아래 기술 스택을 사용해:

[기술 스택]
- 언어: TypeScript (백엔드/프론트엔드 공통)
- 백엔드 프레임워크: NestJS
- 프론트엔드: React + Vite + TailwindCSS + shadcn/ui
- 데이터베이스: PostgreSQL (운영DB/통계DB), Redis (실시간 상태 캐싱)
- ORM: Prisma
- 통신: TCP 소켓 (PLC 전문 통신), WebSocket (실시간 모니터링), REST API (SIMS/KPLAS 연계)
- 파일 전송: FTP 클라이언트/서버 (MLF 파일, 주소DB 파일)
- 메시지 큐: Bull (Redis 기반, 비동기 작업 처리)
- 모니터링: Prometheus + Grafana
- 컨테이너: Docker + Docker Compose
- 테스트: Jest + Supertest
- 문서화: Swagger (API), AsyncAPI (소켓 통신)

[모노레포 구조]
kpost-automation-platform/
├── apps/
│   ├── central-relay/        # 중앙 중계기 서버
│   ├── local-relay/          # 로컬 중계기 서버
│   ├── standard-sw/          # 표준 SW (SMC/CGS 통합)
│   ├── web-dashboard/        # 웹 대시보드 (React)
│   └── plc-simulator/        # PLC 시뮬레이터 (테스트용)
├── packages/
│   ├── protocol/             # 표준 인터페이스 프로토콜 정의
│   ├── telegram/             # PLC 전문(Telegram) 파서/빌더
│   ├── database/             # Prisma 스키마 및 DB 유틸리티
│   ├── common/               # 공통 타입, 상수, 유틸리티
│   └── logger/               # 통합 로깅 모듈
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfile.*
├── docs/
│   ├── architecture/
│   ├── interface-specs/
│   └── api/
├── turbo.json
├── package.json
└── tsconfig.base.json

각 패키지와 앱의 package.json, tsconfig.json을 설정하고, 
turborepo를 이용한 빌드 파이프라인을 구성해줘.
Docker Compose로 PostgreSQL, Redis, 개발 환경을 구성해줘.
```
