import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    create(dto: CreateProductDto) { 
        return this.prisma.product.create({
            data: {
                ...dto,
                price: Number(dto.price),
            },
        });
    }

    async findAll(query: QueryProductsDto) { 
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {
            isActive: true,
            ...(query.search 
                ? {
                    OR: [
                        { name: { contains: query.search, mode: 'insensitive' } },
                        { description: { contains: query.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
            ...(query.categoryId ? { categoryId: query.categoryId } : {}
            )
        };

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
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    findOne(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
    }
}
