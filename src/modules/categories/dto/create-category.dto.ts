import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  name: string = '';

  @ApiProperty({ example: 'electronics' })
  @IsString()
  slug: string = '';
}
