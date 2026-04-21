import { ApiProperty } from '@nestjs/swagger';
import { LedgerEntryType } from '@prisma/client';

export class WalletLedgerEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  walletId!: string;

  @ApiProperty({ required: false, format: 'uuid' })
  orderId?: string;

  @ApiProperty({ enum: LedgerEntryType, example: LedgerEntryType.DEPOSIT })
  type!: LedgerEntryType;

  @ApiProperty({ example: '50.00' })
  amount!: string;

  @ApiProperty({ example: '150.00' })
  balanceAfter!: string;

  @ApiProperty({ required: false, example: 'deposit:retry-key-1' })
  idempotencyKey?: string;

  @ApiProperty({ required: false, example: { source: 'sandbox-deposit' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class WalletResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ example: '150.00' })
  balance!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: WalletLedgerEntryResponseDto, isArray: true })
  entries!: WalletLedgerEntryResponseDto[];
}
