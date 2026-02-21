import {
  TelegramDefinition, TelegramFieldDef,
  STX, ETX, HEADER_SIZE,
} from './types';

/**
 * PLC 전문 빌더
 * TypeScript 객체 → Buffer 변환
 */
export class TelegramBuilder {
  private dataType: string = 'D';
  private moduleId: string = 'PSM00';

  setDataType(type: string): this {
    this.dataType = type.charAt(0);
    return this;
  }

  setModuleId(id: string): this {
    this.moduleId = id.substring(0, 6);
    return this;
  }

  /**
   * 전문 정의와 데이터로 Buffer 빌드
   */
  build(definition: TelegramDefinition, data: Record<string, number>): Buffer {
    // 데이터 영역 크기 계산
    const dataLength = definition.fields.reduce((sum, f) => sum + f.size, 0);

    // 전체 버퍼 크기: HEADER(12) + DATA + ETX(1)
    const totalSize = HEADER_SIZE + dataLength + 1;
    const buffer = Buffer.alloc(totalSize);

    let offset = 0;

    // STX (1 byte)
    buffer.writeUInt8(STX, offset);
    offset += 1;

    // DataType (1 byte)
    buffer.writeUInt8(this.dataType.charCodeAt(0), offset);
    offset += 1;

    // ModuleID (6 bytes)
    const moduleIdBuf = Buffer.alloc(6, 0);
    moduleIdBuf.write(this.moduleId, 0, 'ascii');
    moduleIdBuf.copy(buffer, offset);
    offset += 6;

    // TelegramNo (2 bytes)
    buffer.writeUInt16BE(definition.telegramNo, offset);
    offset += 2;

    // DataLength (2 bytes)
    buffer.writeUInt16BE(dataLength, offset);
    offset += 2;

    // 가변 데이터 필드
    for (const field of definition.fields) {
      const value = data[field.name] ?? 0;
      if (field.size === 4) {
        buffer.writeUInt32BE(value, offset);
      } else if (field.size === 2) {
        buffer.writeUInt16BE(value, offset);
      } else if (field.size === 1) {
        buffer.writeUInt8(value, offset);
      }
      offset += field.size;
    }

    // ETX (1 byte)
    buffer.writeUInt8(ETX, offset);

    return buffer;
  }

  /**
   * 빠른 빌드 (정의 + 데이터만으로 바로 생성)
   */
  static quickBuild(definition: TelegramDefinition, data: Record<string, number>, moduleId = 'PSM00'): Buffer {
    return new TelegramBuilder().setModuleId(moduleId).build(definition, data);
  }
}
