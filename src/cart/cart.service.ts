import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) {}

    async getCartByUser(userId: string) {
        return this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async addItem(userId: string, dto: AddCartItemDto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });

        if (!product || !product.isActive) {
            throw new BadRequestException('Product not found or inactive');
        }
        
        const cart = await this.prisma.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });

        const existing = await this.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: dto.productId,
            },
        });

        if (existing) {
            return this.prisma.cartItem.update({
                where: { id: existing.id },
                data: {
                    quantity: existing.quantity + dto.quantity,
                }
            });
        }

        return this.prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId: dto.productId,
                quantity: dto.quantity,
            },
        });
    }
}
