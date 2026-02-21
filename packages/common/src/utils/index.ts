/**
 * 날짜를 YYYYMMDD 형식 문자열로 변환
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * 날짜를 HHmmss 형식 문자열로 변환
 */
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}${min}${s}`;
}

/**
 * 고유 ID 생성 (간단한 UUID v4 대체)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 밀리초 대기
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 바이트 배열을 16진수 문자열로 변환
 */
export function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex').toUpperCase();
}

/**
 * 16진수 문자열을 바이트 배열로 변환
 */
export function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}
