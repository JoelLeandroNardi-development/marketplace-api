import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  PaginatedProductsResponse,
  ProductsService,
  ProductWithCategory,
} from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Input validation failed' })
  create(@Body() dto: CreateProductDto): Promise<ProductWithCategory> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get a list of products with pagination and filtering',
  })
  @ApiOkResponse({
    description: 'Paginated product list',
    type: PaginatedProductsResponseDto,
  })
  findAll(
    @Query() query: QueryProductsDto,
  ): Promise<PaginatedProductsResponse> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiOkResponse({
    description: 'Product details',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id') id: string): Promise<ProductWithCategory> {
    return this.productsService.findOne(id);
  }
}
