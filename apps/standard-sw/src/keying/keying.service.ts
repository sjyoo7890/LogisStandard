import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createLogger } from '@kpost/logger';

export type StationStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';
export type KeyingRequestStatus = 'PENDING' | 'DISPLAYED' | 'COMPLETED' | 'EXPIRED';

export interface KeyButton {
  index: number;
  label: string;
  destination: string;
  chuteNumber: number;
}

export interface KeyingStation {
  id: string;
  name: string;
  status: StationStatus;
  buttons: KeyButton[];
  operatorId?: string;
  processedCount: number;
  lastActivity?: string;
}

export interface KeyingRequest {
  id: string;
  barcode: string;
  imageUrl: string;
  stationId: string;
  status: KeyingRequestStatus;
  requestedAt: string;
  displayedAt?: string;
  completedAt?: string;
  selectedButton?: number;
  destination?: string;
  chuteNumber?: number;
}

export interface KeyingHistoryEntry {
  requestId: string;
  stationId: string;
  barcode: string;
  destination: string;
  chuteNumber: number;
  processingTimeMs: number;
  completedAt: string;
}

@Injectable()
export class KeyingService implements OnModuleInit, OnModuleDestroy {
  private logger = createLogger({ service: 'keying' });
  private stations = new Map<string, KeyingStation>();
  private requests: KeyingRequest[] = [];
  private history: KeyingHistoryEntry[] = [];
  private keyingListeners: Array<(event: KeyingRequest) => void> = [];
  private requestIdCounter = 0;

  private static readonly MAX_HISTORY = 500;
  private static readonly DESTINATIONS = [
    '서울강북', '서울강남', '서울서부', '서울동부',
    '경기북부', '경기남부', '경기광역', '인천/강원',
    '충청권', '전라/경상', '세종', '제주',
    '울산', '대구', '광주', '대전',
  ];

  onModuleInit() {
    this.initializeStations();
    this.logger.info('KeyingService initialized with 2 stations');
  }

  onModuleDestroy() {
    this.logger.info('KeyingService destroyed');
  }

  private initializeStations(): void {
    for (let s = 1; s <= 2; s++) {
      const stationId = `KST-${String(s).padStart(2, '0')}`;
      const buttons: KeyButton[] = KeyingService.DESTINATIONS.map((dest, i) => ({
        index: i + 1,
        label: `${String(i + 1).padStart(2, '0')}-${dest}`,
        destination: dest,
        chuteNumber: i + 1,
      }));
      this.stations.set(stationId, {
        id: stationId,
        name: `타건 스테이션 ${s}`,
        status: 'ONLINE',
        buttons,
        processedCount: 0,
      });
    }
  }

  // ============================
  // 스테이션 관리
  // ============================

  getAllStations(): KeyingStation[] {
    return Array.from(this.stations.values());
  }

  getStation(stationId: string): KeyingStation | undefined {
    return this.stations.get(stationId);
  }

  // ============================
  // 타건 요청 흐름
  // ============================

  createRequest(barcode: string, stationId: string): KeyingRequest {
    this.requestIdCounter++;
    const request: KeyingRequest = {
      id: `KR-${String(this.requestIdCounter).padStart(5, '0')}`,
      barcode,
      imageUrl: `/images/mail/${barcode}.jpg`,
      stationId,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };
    this.requests.unshift(request);

    // 즉시 DISPLAYED로 전환 (시뮬레이션)
    request.status = 'DISPLAYED';
    request.displayedAt = new Date().toISOString();

    for (const listener of this.keyingListeners) {
      listener(request);
    }
    this.logger.info(`Keying request ${request.id} created for station ${stationId}`);
    return request;
  }

  completeRequest(requestId: string, buttonIndex: number): KeyingRequest | undefined {
    const request = this.requests.find((r) => r.id === requestId);
    if (!request || request.status === 'COMPLETED') return undefined;

    const station = this.stations.get(request.stationId);
    if (!station) return undefined;

    const button = station.buttons.find((b) => b.index === buttonIndex);
    if (!button) return undefined;

    request.status = 'COMPLETED';
    request.completedAt = new Date().toISOString();
    request.selectedButton = buttonIndex;
    request.destination = button.destination;
    request.chuteNumber = button.chuteNumber;

    station.processedCount++;
    station.lastActivity = request.completedAt;

    // 이력 기록
    const entry: KeyingHistoryEntry = {
      requestId: request.id,
      stationId: request.stationId,
      barcode: request.barcode,
      destination: button.destination,
      chuteNumber: button.chuteNumber,
      processingTimeMs: new Date(request.completedAt).getTime() - new Date(request.requestedAt).getTime(),
      completedAt: request.completedAt,
    };
    this.history.unshift(entry);
    if (this.history.length > KeyingService.MAX_HISTORY) {
      this.history = this.history.slice(0, KeyingService.MAX_HISTORY);
    }

    for (const listener of this.keyingListeners) {
      listener(request);
    }
    return request;
  }

  // ============================
  // 조회
  // ============================

  getPendingRequests(stationId?: string): KeyingRequest[] {
    let filtered = this.requests.filter((r) => r.status !== 'COMPLETED' && r.status !== 'EXPIRED');
    if (stationId) filtered = filtered.filter((r) => r.stationId === stationId);
    return filtered;
  }

  getHistory(limit = 50): KeyingHistoryEntry[] {
    return this.history.slice(0, limit);
  }

  getStats() {
    const stations = this.getAllStations();
    const totalProcessed = stations.reduce((sum, s) => sum + s.processedCount, 0);
    const avgProcessingTime = this.history.length > 0
      ? Math.round(this.history.reduce((sum, h) => sum + h.processingTimeMs, 0) / this.history.length)
      : 0;
    return {
      totalStations: stations.length,
      onlineStations: stations.filter((s) => s.status === 'ONLINE').length,
      totalProcessed,
      pendingRequests: this.requests.filter((r) => r.status === 'PENDING' || r.status === 'DISPLAYED').length,
      avgProcessingTimeMs: avgProcessingTime,
    };
  }

  getStatus() {
    return {
      stations: this.stations.size,
      stats: this.getStats(),
    };
  }

  // ============================
  // 이벤트 리스너
  // ============================

  onKeyingEvent(listener: (event: KeyingRequest) => void): void {
    this.keyingListeners.push(listener);
  }
}
