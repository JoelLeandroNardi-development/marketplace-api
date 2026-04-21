import { ApiProperty } from '@nestjs/swagger';

class ProductCategoryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Electronics' })
  name!: string;

  @ApiProperty({ example: 'electronics' })
  slug!: string;
}

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Wireless Keyboard' })
  name!: string;

  @ApiProperty({ example: 'wireless-keyboard' })
  slug!: string;

  @ApiProperty({ required: false, example: 'Compact Bluetooth keyboard' })
  description?: string;

  @ApiProperty({
    description: 'Product price as a decimal string with two fraction digits',
    example: '49.90',
  })
  price!: string;

  @ApiProperty({ example: 120 })
  stock!: number;

  @ApiProperty({
    required: false,
    example: 'https://cdn.example.com/products/keyboard.jpg',
  })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  @ApiProperty({ type: ProductCategoryDto })
  category!: ProductCategoryDto;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

class ProductPaginationMetaDto {
  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 12 })
  totalPages!: number;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: ProductResponseDto, isArray: true })
  data!: ProductResponseDto[];

  @ApiProperty({ type: ProductPaginationMetaDto })
  meta!: ProductPaginationMetaDto;
}
