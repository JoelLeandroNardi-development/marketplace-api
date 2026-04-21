import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category display name',
    example: 'Electronics',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Unique URL-friendly category slug',
    example: 'electronics',
  })
  @IsString()
  slug!: string;
}
