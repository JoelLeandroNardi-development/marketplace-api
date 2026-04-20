import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0.01)
  amount: number = 0;
}
