import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Public product name',
    example: 'Wireless Keyboard',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'URL-friendly unique slug',
    example: 'wireless-keyboard',
  })
  @IsString()
  slug!: string;

  @ApiProperty({
    required: false,
    description: 'Optional rich product description',
    example: 'Compact Bluetooth keyboard with multi-device support',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price as a decimal number with two fractional digits',
    example: 49.9,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({
    description: 'Current available stock quantity',
    example: 120,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({
    required: false,
    description: 'Optional image URL shown in clients',
    example: 'https://cdn.example.com/products/keyboard.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Target category identifier',
    format: 'uuid',
  })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({
    required: false,
    default: true,
    description: 'Whether this product is publicly visible for purchase',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
