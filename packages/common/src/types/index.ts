// 설비 타입 정의
export enum EquipmentType {
  FSS = 'FSS',     // 일반소포자동분류기
  AFCS = 'AFCS',   // 통상우편자동분류기
  PPSS = 'PPSS',   // 등기소포자동분류기
  IOSS = 'IOSS',   // 국제발착자동분류기
  PLCS = 'PLCS',   // 소형택배자동분류기
}

// 설비 상태
export enum EquipmentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE',
}

// 통신 프로토콜 타입
export enum ProtocolType {
  TCP_SOCKET = 'TCP_SOCKET',
  WEBSOCKET = 'WEBSOCKET',
  REST_API = 'REST_API',
  FTP = 'FTP',
}

// 결과 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// 페이징 관련 타입
export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 관서 정보
export interface PostOffice {
  code: string;       // 관서 코드
  name: string;       // 관서명
  region: string;     // 지역
  type: 'CENTER' | 'OFFICE';  // 집중국/우체국
}

// 작업 정보
export interface SortingJob {
  jobId: string;
  equipmentType: EquipmentType;
  postOfficeCode: string;
  startTime: Date;
  endTime?: Date;
  totalItems: number;
  processedItems: number;
  errorItems: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
