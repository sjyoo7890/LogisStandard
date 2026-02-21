import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { SimEquipmentType } from '../profile/profile.types';

export class UpdateConfigDto {
  @ApiPropertyOptional({ description: '인덕션 수', minimum: 1, maximum: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  inductionCount?: number;

  @ApiPropertyOptional({ description: '슈트 수' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  chuteCount?: number;

  @ApiPropertyOptional({ description: '투입 간격 (ms)' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  inductionIntervalMs?: number;

  @ApiPropertyOptional({ description: '에러 발생 확률 (0.0~1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  errorProbability?: number;

  @ApiPropertyOptional({ description: '구분 성공률 (0.0~1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sortSuccessRate?: number;

  @ApiPropertyOptional({ description: '미인식률 (0.0~1.0)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  noReadRate?: number;

  @ApiPropertyOptional({ description: '슈트당 만재 임계값' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  overflowThreshold?: number;

  @ApiPropertyOptional({ description: '투입→배출 소요시간 (ms)' })
  @IsOptional()
  @IsNumber()
  @Min(100)
  transitTimeMs?: number;

  @ApiPropertyOptional({ description: '배출→확인 소요시간 (ms)' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  confirmDelayMs?: number;
}

export class StartScenarioDto {
  @ApiProperty({ description: '시나리오 ID', example: 'normal' })
  @IsString()
  scenarioId!: string;
}

export class ApplyProfileDto {
  @ApiProperty({
    description: '구분기 유형',
    enum: SimEquipmentType,
    example: SimEquipmentType.PARCEL,
  })
  @IsEnum(SimEquipmentType)
  type!: SimEquipmentType;
}

export class TriggerFaultDto {
  @ApiProperty({ description: '장애 유형', example: 'MOTOR_TRIP', enum: ['MOTOR_TRIP', 'JAM', 'OVERFLOW'] })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: '인덕션 번호 (JAM/OVERFLOW)', example: 1 })
  @IsOptional()
  @IsNumber()
  inductionNo?: number;
}
