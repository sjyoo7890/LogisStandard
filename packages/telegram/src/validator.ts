import {
  TelegramDefinition, TelegramFieldDef,
  STX, ETX, HEADER_SIZE, MIN_TELEGRAM_SIZE,
} from './types';
import { TelegramRegistry } from './factory';

/**
 * 검증 결과
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 전문 유효성 검증기
 */
export class TelegramValidator {
  /**
   * 전체 전문 검증
   */
  static validate(buffer: Buffer, definition?: TelegramDefinition): ValidationResult {
    const errors: string[] = [];

    // 1. 최소 크기 검증
    if (buffer.length < MIN_TELEGRAM_SIZE) {
      errors.push(`Buffer too short: ${buffer.length} bytes (minimum: ${MIN_TELEGRAM_SIZE})`);
      return { valid: false, errors };
    }

    // 2. STX 검증
    const stx = buffer.readUInt8(0);
    if (stx !== STX) {
      errors.push(`Invalid STX: expected 0x02, got 0x${stx.toString(16).padStart(2, '0')}`);
    }

    // 3. 헤더 필드 검증
    const telegramNo = buffer.readUInt16BE(8);
    const dataLength = buffer.readUInt16BE(10);

    // 4. 정의 조회 (제공되지 않으면 레지스트리에서 검색)
    const def = definition ?? TelegramRegistry.get(telegramNo);
    if (!def) {
      errors.push(`Unknown telegram number: ${telegramNo}`);
    }

    // 5. 데이터 길이 검증
    if (def) {
      const expectedDataLength = def.fields.reduce((sum, f) => sum + f.size, 0);
      if (dataLength !== expectedDataLength) {
        errors.push(`Data length mismatch: header says ${dataLength}, definition expects ${expectedDataLength}`);
      }
    }

    // 6. 전체 버퍼 크기 검증
    const expectedTotalSize = HEADER_SIZE + dataLength + 1; // +1 for ETX
    if (buffer.length < expectedTotalSize) {
      errors.push(`Buffer size ${buffer.length} too small for total expected ${expectedTotalSize}`);
    }

    // 7. ETX 검증
    if (buffer.length >= expectedTotalSize) {
      const etx = buffer.readUInt8(HEADER_SIZE + dataLength);
      if (etx !== ETX) {
        errors.push(`Invalid ETX: expected 0x03, got 0x${etx.toString(16).padStart(2, '0')}`);
      }
    }

    // 8. 필수 필드 검증 (데이터 영역)
    if (def && buffer.length >= expectedTotalSize) {
      let offset = HEADER_SIZE;
      for (const field of def.fields) {
        if (offset + field.size > HEADER_SIZE + dataLength) {
          errors.push(`Field '${field.name}' exceeds data boundary`);
          break;
        }
        offset += field.size;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 빠른 유효성 검증 (STX/ETX만 확인)
   */
  static quickValidate(buffer: Buffer): boolean {
    if (buffer.length < MIN_TELEGRAM_SIZE) return false;
    if (buffer.readUInt8(0) !== STX) return false;

    const dataLength = buffer.readUInt16BE(10);
    const etxOffset = HEADER_SIZE + dataLength;
    if (etxOffset >= buffer.length) return false;

    return buffer.readUInt8(etxOffset) === ETX;
  }
}
