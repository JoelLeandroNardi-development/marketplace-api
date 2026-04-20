import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let tx: {
    product: { findUnique: jest.Mock };
    cart: { upsert: jest.Mock };
    cartItem: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    tx = {
      product: { findUnique: jest.fn() },
      cart: { upsert: jest.fn() },
      cartItem: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(
              (callback: (transaction: typeof tx) => unknown) => callback(tx),
            ),
            cart: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('rejects adding more items than are in stock', async () => {
    tx.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: 'Keyboard',
      stock: 2,
      isActive: true,
    });
    tx.cart.upsert.mockResolvedValue({ id: 'cart-1' });
    tx.cartItem.findUnique.mockResolvedValue({ id: 'item-1', quantity: 2 });

    await expect(
      service.addItem('user-1', {
        productId: 'product-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('increments an existing cart item when stock allows it', async () => {
    tx.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: 'Keyboard',
      stock: 5,
      isActive: true,
    });
    tx.cart.upsert.mockResolvedValue({ id: 'cart-1' });
    tx.cartItem.findUnique.mockResolvedValue({ id: 'item-1', quantity: 2 });
    tx.cartItem.update.mockResolvedValue({ id: 'item-1', quantity: 4 });

    const result = await service.addItem('user-1', {
      productId: 'product-1',
      quantity: 2,
    });

    expect(result).toEqual({ id: 'item-1', quantity: 4 });
    expect(tx.cartItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 4 },
    });
  });
});
