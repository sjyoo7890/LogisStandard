# LogisStandard

우정사업본부 자동화설비 표준 인터페이스 통합플랫폼

우편물류 현장의 구분기(Sorter), 컨베이어, IPS(영상인식), 슈트 디스플레이 등 자동화 설비를 표준화된 프로토콜로 연동하고, 실시간 모니터링·구분계획 관리·통계 분석을 제공하는 통합 시스템입니다.

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard                         │
│                (React + Vite + Tailwind)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ WebSocket / REST
┌───────────────────────┴─────────────────────────────────┐
│                   Standard SW                            │
│       (구분관리 · 키잉 · 슈트현황 · 통계 · 알람)           │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
┌─────────┴──────────┐  ┌────────────┴───────────┐
│   Central Relay     │  │     Local Relay         │
│ (중앙중계기 서버)    │  │  (로컬중계기 서버)       │
│ DB동기화 · FTP전송   │  │  PLC연결 · IPS · 장비    │
│ Socket통신 · Fallback│  │  시뮬레이터 · 테스트러너  │
└─────────────────────┘  └────────────┬───────────┘
                                      │ TCP/IP
                          ┌───────────┴───────────┐
                          │    PLC Simulator       │
                          │  (구분기 시뮬레이션)     │
                          │  시나리오 · 장애주입     │
                          └───────────────────────┘
```

## 프로젝트 구조

```
LogisStandard/
├── apps/
│   ├── central-relay/      # 중앙중계기 서버 (NestJS)
│   ├── local-relay/        # 로컬중계기 서버 (NestJS)
│   ├── standard-sw/        # 표준SW - 구분관리/관제 (NestJS)
│   ├── plc-simulator/      # PLC 시뮬레이터 (NestJS)
│   └── web-dashboard/      # 웹 대시보드 (React + Vite)
├── packages/
│   ├── common/             # 공통 타입, 상수, 유틸리티
│   ├── protocol/           # 표준 프로토콜 정의 (중앙/로컬)
│   ├── telegram/           # PLC 전문 파서/빌더
│   ├── database/           # Prisma 스키마 및 DB 클라이언트
│   ├── logger/             # 공통 로거
│   └── test-helpers/       # 테스트 픽스처, 목, 헬퍼
├── docker/                 # Docker Compose 및 설정
├── e2e/                    # E2E 통합 테스트 시나리오
└── docs/                   # Phase별 개발 문서
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Monorepo | Turborepo + npm workspaces |
| Backend | NestJS (TypeScript) |
| Frontend | React 18 + Vite + Tailwind CSS |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis 7 + Bull |
| 실시간 통신 | WebSocket (Socket.IO) |
| PLC 통신 | TCP/IP 소켓 (커스텀 전문) |
| 컨테이너 | Docker Compose |
| 테스트 | Jest + Supertest |

## 주요 기능

- **구분계획 관리** - 슈트별 행선지 배정, 구분코드 매핑, 특수키 관리
- **키잉(Keying)** - 바코드 미인식 우편물 수동 행선지 지정
- **실시간 모니터링** - 설비 상태, 알람, 처리량 실시간 대시보드
- **슈트 현황판** - 슈트별 행선지/물량 현황, 만재 알림
- **통계 분석** - 시간대별/슈트별/구분코드별 처리 통계
- **중앙-로컬 연계** - DB 동기화, FTP 파일 전송, Socket 통신, Fallback
- **PLC 시뮬레이터** - 정상/장애/부하 시나리오 기반 구분기 시뮬레이션
- **알람 관리** - HMI 알람 정의, 이력 관리, 실시간 알림

## 시작하기

### 사전 요구사항

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose

### 설치

```bash
# 저장소 클론
git clone https://github.com/sjyoo7890/LogisStandard.git
cd LogisStandard

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
```

### 인프라 실행

```bash
# PostgreSQL + Redis 컨테이너 실행
docker compose -f docker/docker-compose.yml up -d

# DB 마이그레이션
npx prisma migrate dev --schema packages/database/prisma/schema.prisma
```

### 개발 서버 실행

```bash
# 전체 앱 동시 실행
npm run dev

# 개별 앱 실행
npx turbo run dev --filter=central-relay
npx turbo run dev --filter=local-relay
npx turbo run dev --filter=standard-sw
npx turbo run dev --filter=web-dashboard
npx turbo run dev --filter=plc-simulator
```

### 포트 구성

| 서비스 | 포트 |
|--------|------|
| Central Relay | 3000 |
| Local Relay | 3100 |
| Standard SW | 3200 |
| PLC Simulator | 4000 |
| Web Dashboard | 5173 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## 테스트

```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# E2E 테스트 (Docker 필요)
npm run test:e2e:full

# 전체 CI 테스트
npm run test:ci
```

## 데이터베이스 스키마

두 개의 PostgreSQL 스키마로 구성됩니다:

- **psm_operation** - 운영 데이터 (장비 모델, 구분계획, 소포 정보, 알람, 통계)
- **psm_reginfo** - SIMS 연계 데이터 (송신용 통계, 구분결과, 설비상태)

## 문서

`docs/` 디렉토리에 Phase별 상세 설계 문서가 포함되어 있습니다:

| 문서 | 내용 |
|------|------|
| Phase 0 | 프로젝트 초기화 및 기술스택 설정 |
| Phase 1 | 표준 프로토콜 패키지 |
| Phase 2 | PLC 전문 Telegram 패키지 |
| Phase 3 | 데이터베이스 설계 |
| Phase 4 | 중앙중계기 서버 |
| Phase 5 | 로컬중계기 서버 |
| Phase 6 | 표준SW (구분관리/관제/모니터링) |
| Phase 7 | 웹 대시보드 |
| Phase 8 | PLC 시뮬레이터 |
| Phase 9 | 통합/E2E 테스트 |
| Phase 10 | 배포 및 운영환경 구성 |

## 라이선스

Private - 우정사업본부 내부 프로젝트
