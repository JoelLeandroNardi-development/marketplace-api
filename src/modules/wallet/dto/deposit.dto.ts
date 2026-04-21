import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'Sandbox amount to deposit into wallet',
    example: 50,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}
