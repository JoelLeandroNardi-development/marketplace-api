import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiCreatedResponse({
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Input validation failed' })
  create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiOkResponse({
    description: 'Sorted list of all categories',
    type: CategoryResponseDto,
    isArray: true,
  })
  findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }
}
