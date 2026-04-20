import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntryType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let tx: {
    ledgerEntry: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    wallet: { upsert: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      ledgerEntry: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      wallet: { upsert: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(
              (callback: (transaction: typeof tx) => unknown) => callback(tx),
            ),
            wallet: {
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('requires idempotency keys for deposits', async () => {
    await expect(
      service.deposit('user-1', { amount: 10 }, ''),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns the existing ledger entry when a deposit is retried', async () => {
    tx.ledgerEntry.findUnique.mockResolvedValue({ id: 'ledger-1' });

    await expect(
      service.deposit('user-1', { amount: 10 }, 'deposit-1'),
    ).resolves.toEqual({
      id: 'ledger-1',
    });
  });

  it('records a deposit ledger entry with the updated balance', async () => {
    tx.ledgerEntry.findUnique.mockResolvedValue(null);
    tx.wallet.upsert.mockResolvedValue({
      id: 'wallet-1',
      balance: new Prisma.Decimal(25),
    });
    tx.ledgerEntry.create.mockResolvedValue({ id: 'ledger-1' });

    await service.deposit('user-1', { amount: 25 }, 'deposit-1');

    const createCalls = tx.ledgerEntry.create.mock.calls as [
      {
        data: {
          walletId: string;
          type: LedgerEntryType;
          amount: Prisma.Decimal;
          balanceAfter: Prisma.Decimal;
          idempotencyKey: string;
        };
      },
    ][];
    const createArgs = createCalls[0][0];

    expect(createArgs.data.walletId).toBe('wallet-1');
    expect(createArgs.data.type).toBe(LedgerEntryType.DEPOSIT);
    expect(createArgs.data.amount.toString()).toBe('25');
    expect(createArgs.data.balanceAfter.toString()).toBe('25');
    expect(createArgs.data.idempotencyKey).toBe('deposit:deposit-1');
  });
});
