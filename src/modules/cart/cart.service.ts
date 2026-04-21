import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Prisma } from '@prisma/client';

export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

export type CartItemRecord = Prisma.CartItemGetPayload<Record<string, never>>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartByUser(userId: string): Promise<CartWithItems> {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartItemRecord> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product || !product.isActive) {
        throw new BadRequestException('Product not found or inactive');
      }

      const cart = await tx.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: dto.productId,
          },
        },
      });

      const nextQuantity = (existing?.quantity ?? 0) + dto.quantity;

      if (nextQuantity > product.stock) {
        throw new BadRequestException(
          `Only ${product.stock} items are available for ${product.name}`,
        );
      }

      if (existing) {
        return tx.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: nextQuantity,
          },
        });
      }

      return tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    });
  }
}
