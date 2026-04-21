import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: {
    category: true;
  };
}>;

interface ProductsPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedProductsResponse {
  data: ProductWithCategory[];
  meta: ProductsPaginationMeta;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProductDto): Promise<ProductWithCategory> {
    return this.prisma.product.create({
      data: {
        ...dto,
        price: new Prisma.Decimal(dto.price),
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(query: QueryProductsDto): Promise<PaginatedProductsResponse> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where = this.buildFindAllWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: this.buildPaginationMeta(total, page, limit),
    };
  }

  async findOne(id: string): Promise<ProductWithCategory> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private buildFindAllWhere(query: QueryProductsDto): Prisma.ProductWhereInput {
    return {
      isActive: true,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };
  }

  private buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): ProductsPaginationMeta {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
