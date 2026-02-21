import {
  TelegramHeader, Telegram, TelegramFieldDef, TelegramDefinition,
  STX, ETX, HEADER_SIZE,
} from './types';
import { TelegramRegistry } from './factory';

/**
 * PLC 전문 파서
 * Buffer → TypeScript 객체 변환
 */
export class TelegramParser {
  /**
   * 헤더 파싱
   */
  static parseHeader(buffer: Buffer): TelegramHeader {
    if (buffer.length < HEADER_SIZE) {
      throw new Error(`Buffer too short for header: ${buffer.length} < ${HEADER_SIZE}`);
    }

    const stx = buffer.readUInt8(0);
    if (stx !== STX) {
      throw new Error(`Invalid STX: expected 0x02, got 0x${stx.toString(16).padStart(2, '0')}`);
    }

    return {
      stx,
      dataType: String.fromCharCode(buffer.readUInt8(1)),
      moduleId: buffer.subarray(2, 8).toString('ascii').replace(/\0/g, ''),
      telegramNo: buffer.readUInt16BE(8),
      dataLength: buffer.readUInt16BE(10),
    };
  }

  /**
   * 가변 데이터 영역 파싱 (필드 정의 기반)
   */
  static parseData(buffer: Buffer, offset: number, fields: TelegramFieldDef[]): Record<string, number> {
    const data: Record<string, number> = {};
    let pos = offset;

    for (const field of fields) {
      if (pos + field.size > buffer.length) {
        throw new Error(`Buffer overflow parsing field '${field.name}' at offset ${pos}`);
      }
      if (field.size === 4) {
        data[field.name] = buffer.readUInt32BE(pos);
      } else if (field.size === 2) {
        data[field.name] = buffer.readUInt16BE(pos);
      } else if (field.size === 1) {
        data[field.name] = buffer.readUInt8(pos);
      }
      pos += field.size;
    }

    return data;
  }

  /**
   * 전체 전문 파싱 (전문 정의 사용)
   */
  static parse<T = Record<string, number>>(buffer: Buffer, definition: TelegramDefinition): Telegram<T> {
    const header = this.parseHeader(buffer);

    if (header.telegramNo !== definition.telegramNo) {
      throw new Error(
        `Telegram number mismatch: expected ${definition.telegramNo}, got ${header.telegramNo}`,
      );
    }

    const data = this.parseData(buffer, HEADER_SIZE, definition.fields) as T;

    const etxOffset = HEADER_SIZE + header.dataLength;
    if (etxOffset >= buffer.length) {
      throw new Error(`ETX offset ${etxOffset} out of bounds (buffer length: ${buffer.length})`);
    }

    const etx = buffer.readUInt8(etxOffset);
    if (etx !== ETX) {
      throw new Error(`Invalid ETX: expected 0x03, got 0x${etx.toString(16).padStart(2, '0')}`);
    }

    return { header, data, etx };
  }

  /**
   * 자동 파싱 (전문 번호로 정의를 자동 검색)
   */
  static autoParse(buffer: Buffer): Telegram {
    const header = this.parseHeader(buffer);
    const definition = TelegramRegistry.get(header.telegramNo);

    if (!definition) {
      throw new Error(`Unknown telegram number: ${header.telegramNo}`);
    }

    return this.parse(buffer, definition);
  }
}
