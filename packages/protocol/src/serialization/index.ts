import { z } from 'zod';

/**
 * 바이너리 직렬화/역직렬화 유틸리티
 * PLC 전문 등 바이너리 프로토콜 처리에 사용
 */

// 필드 타입 정의
export type FieldType = 'uint8' | 'uint16be' | 'uint32be' | 'int16be' | 'int32be' | 'ascii' | 'hex' | 'bcd';

export interface FieldDefinition {
  name: string;
  type: FieldType;
  length: number;        // 바이트 수
  description?: string;
}

/**
 * 바이너리 직렬화기
 * 필드 정의에 따라 객체를 Buffer로 변환
 */
export class BinarySerializer {
  private fields: FieldDefinition[];

  constructor(fields: FieldDefinition[]) {
    this.fields = fields;
  }

  /**
   * 총 바이트 크기 계산
   */
  getTotalSize(): number {
    return this.fields.reduce((sum, f) => sum + f.length, 0);
  }

  /**
   * 객체 → Buffer 직렬화
   */
  serialize(data: Record<string, unknown>): Buffer {
    const buffer = Buffer.alloc(this.getTotalSize());
    let offset = 0;

    for (const field of this.fields) {
      const value = data[field.name];
      this.writeField(buffer, offset, field, value);
      offset += field.length;
    }

    return buffer;
  }

  /**
   * Buffer → 객체 역직렬화
   */
  deserialize(buffer: Buffer): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    let offset = 0;

    for (const field of this.fields) {
      result[field.name] = this.readField(buffer, offset, field);
      offset += field.length;
    }

    return result;
  }

  private writeField(buffer: Buffer, offset: number, field: FieldDefinition, value: unknown): void {
    switch (field.type) {
      case 'uint8':
        buffer.writeUInt8(Number(value) || 0, offset);
        break;
      case 'uint16be':
        buffer.writeUInt16BE(Number(value) || 0, offset);
        break;
      case 'uint32be':
        buffer.writeUInt32BE(Number(value) || 0, offset);
        break;
      case 'int16be':
        buffer.writeInt16BE(Number(value) || 0, offset);
        break;
      case 'int32be':
        buffer.writeInt32BE(Number(value) || 0, offset);
        break;
      case 'ascii': {
        const str = String(value || '').padEnd(field.length, ' ').substring(0, field.length);
        buffer.write(str, offset, field.length, 'ascii');
        break;
      }
      case 'hex': {
        const hex = String(value || '').padStart(field.length * 2, '0').substring(0, field.length * 2);
        Buffer.from(hex, 'hex').copy(buffer, offset);
        break;
      }
      case 'bcd': {
        const num = String(Number(value) || 0).padStart(field.length * 2, '0');
        for (let i = 0; i < field.length; i++) {
          const high = parseInt(num[i * 2], 10);
          const low = parseInt(num[i * 2 + 1], 10);
          buffer.writeUInt8((high << 4) | low, offset + i);
        }
        break;
      }
    }
  }

  private readField(buffer: Buffer, offset: number, field: FieldDefinition): unknown {
    switch (field.type) {
      case 'uint8':
        return buffer.readUInt8(offset);
      case 'uint16be':
        return buffer.readUInt16BE(offset);
      case 'uint32be':
        return buffer.readUInt32BE(offset);
      case 'int16be':
        return buffer.readInt16BE(offset);
      case 'int32be':
        return buffer.readInt32BE(offset);
      case 'ascii':
        return buffer.subarray(offset, offset + field.length).toString('ascii').trim();
      case 'hex':
        return buffer.subarray(offset, offset + field.length).toString('hex').toUpperCase();
      case 'bcd': {
        let result = '';
        for (let i = 0; i < field.length; i++) {
          const byte = buffer.readUInt8(offset + i);
          result += String((byte >> 4) & 0x0f) + String(byte & 0x0f);
        }
        return parseInt(result, 10);
      }
    }
  }
}

/**
 * JSON 직렬화/역직렬화 (Zod 스키마 기반 검증 포함)
 */
export class JsonSerializer<T> {
  private schema: z.ZodType<T>;

  constructor(schema: z.ZodType<T>) {
    this.schema = schema;
  }

  serialize(data: T): string {
    this.schema.parse(data); // 검증
    return JSON.stringify(data);
  }

  serializeToBuffer(data: T): Buffer {
    return Buffer.from(this.serialize(data), 'utf-8');
  }

  deserialize(json: string): T {
    const parsed = JSON.parse(json);
    return this.schema.parse(parsed);
  }

  deserializeFromBuffer(buffer: Buffer): T {
    return this.deserialize(buffer.toString('utf-8'));
  }

  validate(data: unknown): { success: boolean; data?: T; error?: z.ZodError } {
    const result = this.schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  }
}
