import { ApiProperty } from '@nestjs/swagger';

export class LivenessResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 123.45 })
  uptime!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;
}

class ReadinessChecksDto {
  @ApiProperty({ example: 'ok' })
  database!: string;
}

export class ReadinessResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ type: ReadinessChecksDto })
  checks!: ReadinessChecksDto;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;
}

export class ReadinessErrorResponseDto {
  @ApiProperty({ example: 'Service is not ready' })
  message!: string;

  @ApiProperty({
    example: {
      database: 'unavailable',
    },
  })
  checks!: Record<string, string>;
}
