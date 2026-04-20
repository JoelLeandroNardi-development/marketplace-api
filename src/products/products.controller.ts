import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get a list of products with pagination and filtering' })
    findAll(@Query() query: QueryProductsDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single product by ID' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    findOne(id: string) {
        return this.productsService.findOne(id);
    }
}
