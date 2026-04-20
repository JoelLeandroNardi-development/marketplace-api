import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) {}

    async createFromCart(userId: string) {
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        for (const item of cart.items) {
            if (item.quantity > item.product.stock) {
                throw new BadRequestException(`Not enough stock for product ${item.product.name}`);
            }
        }

        const total = cart.items.reduce((sum, item) => {
            return sum + item.quantity * Number(item.product.price);
        }, 0);

        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    userId,
                    status: OrderStatus.PENDING,
                    totalAmount: new Prisma.Decimal(total),
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.product.price,
                            productName: item.product.name,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        for (const item of cart.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return order;
        });
    }
}
