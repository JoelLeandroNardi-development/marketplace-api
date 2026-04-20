import { BadRequestException, Injectable } from '@nestjs/common';
import { LedgerEntryType, OrderStatus, Prisma } from '@prisma/client';
import { buildScopedIdempotencyKey } from '../../common/idempotency/idempotency-key';
import { PrismaService } from '../../database/prisma/prisma.service';

type CheckoutCart = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

type Wallet = Prisma.WalletGetPayload<Record<string, never>>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createFromCart(userId: string, idempotencyKey: string) {
    const scopedIdempotencyKey = buildScopedIdempotencyKey(
      'checkout',
      idempotencyKey,
      'checkout',
    );

    return this.prisma.$transaction(async (tx) => {
      const existingOrder = await this.findExistingOrder(
        tx,
        scopedIdempotencyKey,
      );

      if (existingOrder) {
        return existingOrder;
      }

      const cart = await this.getCartForCheckoutOrThrow(tx, userId);
      const total = this.calculateCartTotal(cart);
      const wallet = await this.getWalletOrThrow(tx, userId);

      await this.decrementStockOrThrow(tx, cart);
      const updatedWallet = await this.debitWalletOrThrow(tx, wallet.id, total);
      const order = await this.createPaidOrder(
        tx,
        userId,
        scopedIdempotencyKey,
        total,
        cart,
      );

      await this.createDebitLedgerEntry(
        tx,
        wallet.id,
        order.id,
        total,
        updatedWallet.balance,
        scopedIdempotencyKey,
      );
      await this.clearCart(tx, cart.id);

      return order;
    });
  }

  private findExistingOrder(
    tx: Prisma.TransactionClient,
    idempotencyKey: string,
  ) {
    return tx.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: true,
        ledgerEntries: true,
      },
    });
  }

  private async getCartForCheckoutOrThrow(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const cart = await tx.cart.findUnique({
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

    return cart;
  }

  private calculateCartTotal(cart: CheckoutCart) {
    return cart.items.reduce((total, item) => {
      if (!item.product.isActive) {
        throw new BadRequestException(
          `Product ${item.product.name} is no longer available`,
        );
      }

      return total.plus(item.product.price.mul(item.quantity));
    }, new Prisma.Decimal(0));
  }

  private async getWalletOrThrow(tx: Prisma.TransactionClient, userId: string) {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet does not exist for this user');
    }

    return wallet;
  }

  private async decrementStockOrThrow(
    tx: Prisma.TransactionClient,
    cart: CheckoutCart,
  ) {
    for (const item of cart.items) {
      const updateResult = await tx.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updateResult.count !== 1) {
        throw new BadRequestException(
          `Not enough stock for product ${item.product.name}`,
        );
      }
    }
  }

  private async debitWalletOrThrow(
    tx: Prisma.TransactionClient,
    walletId: string,
    total: Prisma.Decimal,
  ): Promise<Wallet> {
    const debitResult = await tx.wallet.updateMany({
      where: {
        id: walletId,
        balance: {
          gte: total,
        },
      },
      data: {
        balance: {
          decrement: total,
        },
      },
    });

    if (debitResult.count !== 1) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return tx.wallet.findUniqueOrThrow({
      where: { id: walletId },
    });
  }

  private createPaidOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    idempotencyKey: string,
    total: Prisma.Decimal,
    cart: CheckoutCart,
  ) {
    return tx.order.create({
      data: {
        userId,
        status: OrderStatus.PAID,
        totalAmount: total,
        idempotencyKey,
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
  }

  private createDebitLedgerEntry(
    tx: Prisma.TransactionClient,
    walletId: string,
    orderId: string,
    total: Prisma.Decimal,
    balanceAfter: Prisma.Decimal,
    idempotencyKey: string,
  ) {
    return tx.ledgerEntry.create({
      data: {
        walletId,
        orderId,
        type: LedgerEntryType.DEBIT,
        amount: total.negated(),
        balanceAfter,
        idempotencyKey,
        metadata: {
          reason: 'cart-checkout',
        },
      },
    });
  }

  private clearCart(tx: Prisma.TransactionClient, cartId: string) {
    return tx.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
