import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    description: 'Target product identifier',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Amount of units to add to the cart',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity!: number;
}
