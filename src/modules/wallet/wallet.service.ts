import { Injectable } from '@nestjs/common';
import { LedgerEntryType, Prisma } from '@prisma/client';
import { buildScopedIdempotencyKey } from '../../common/idempotency/idempotency-key';
import { PrismaService } from '../../database/prisma/prisma.service';
import { DepositDto } from './dto/deposit.dto';

export type WalletWithEntries = Prisma.WalletGetPayload<{
  include: {
    entries: true;
  };
}>;

export type WalletLedgerEntry = Prisma.LedgerEntryGetPayload<
  Record<string, never>
>;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  getWallet(userId: string): Promise<WalletWithEntries> {
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async deposit(
    userId: string,
    dto: DepositDto,
    idempotencyKey: string,
  ): Promise<WalletLedgerEntry> {
    const scopedIdempotencyKey = buildScopedIdempotencyKey(
      'deposit',
      idempotencyKey,
      'wallet mutations',
    );

    return this.prisma.$transaction(async (tx) => {
      const existingEntry = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey: scopedIdempotencyKey },
      });

      if (existingEntry) {
        return existingEntry;
      }

      const amount = new Prisma.Decimal(dto.amount);
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {
          balance: {
            increment: amount,
          },
        },
        create: {
          userId,
          balance: amount,
        },
      });

      return tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: LedgerEntryType.DEPOSIT,
          amount,
          balanceAfter: wallet.balance,
          idempotencyKey: scopedIdempotencyKey,
          metadata: {
            source: 'sandbox-deposit',
          },
        },
      });
    });
  }
}
