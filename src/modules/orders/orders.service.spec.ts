import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntryType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: {
    order: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    cart: { findUnique: jest.Mock };
    wallet: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    product: { updateMany: jest.Mock };
    ledgerEntry: { create: jest.Mock };
    cartItem: { deleteMany: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      order: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      cart: { findUnique: jest.fn() },
      wallet: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      product: { updateMany: jest.fn() },
      ledgerEntry: { create: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(
              (callback: (transaction: typeof tx) => unknown) => callback(tx),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('returns an existing order for a repeated idempotency key', async () => {
    tx.order.findUnique.mockResolvedValue({ id: 'order-1' });

    await expect(
      service.createFromCart('user-1', 'same-request'),
    ).resolves.toEqual({ id: 'order-1' });
  });

  it('checks out a cart by decrementing stock and wallet balance atomically', async () => {
    tx.order.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'order-1',
      items: [],
      ledgerEntries: [],
    });
    tx.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Keyboard',
            price: new Prisma.Decimal(15),
            isActive: true,
          },
        },
      ],
    });
    tx.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(100),
    });
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.wallet.updateMany.mockResolvedValue({ count: 1 });
    tx.wallet.findUniqueOrThrow.mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(70),
    });
    tx.order.create.mockResolvedValue({ id: 'order-1' });
    tx.ledgerEntry.create.mockResolvedValue({ id: 'ledger-1' });

    const result = await service.createFromCart('user-1', 'checkout-1');

    expect(result.id).toBe('order-1');
    const orderCreateCalls = tx.order.create.mock.calls as [
      {
        data: {
          status: OrderStatus;
          totalAmount: Prisma.Decimal;
          idempotencyKey: string;
        };
      },
    ][];
    const ledgerCreateCalls = tx.ledgerEntry.create.mock.calls as [
      {
        data: {
          type: LedgerEntryType;
          amount: Prisma.Decimal;
          balanceAfter: Prisma.Decimal;
        };
      },
    ][];
    const orderCreateArgs = orderCreateCalls[0][0];
    const ledgerCreateArgs = ledgerCreateCalls[0][0];

    expect(orderCreateArgs.data.status).toBe(OrderStatus.PAID);
    expect(orderCreateArgs.data.totalAmount.toString()).toBe('30');
    expect(orderCreateArgs.data.idempotencyKey).toBe('checkout:checkout-1');
    expect(ledgerCreateArgs.data.type).toBe(LedgerEntryType.DEBIT);
    expect(ledgerCreateArgs.data.amount.toString()).toBe('-30');
    expect(ledgerCreateArgs.data.balanceAfter.toString()).toBe('70');
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'cart-1' },
    });
  });

  it('rejects checkout when stock cannot be atomically decremented', async () => {
    tx.order.findUnique.mockResolvedValue(null);
    tx.cart.findUnique.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          product: {
            name: 'Keyboard',
            price: new Prisma.Decimal(15),
            isActive: true,
          },
        },
      ],
    });
    tx.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(100),
    });
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.createFromCart('user-1', 'checkout-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
