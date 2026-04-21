import { ApiProperty } from '@nestjs/swagger';
import { LedgerEntryType, OrderStatus } from '@prisma/client';

class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 'Wireless Keyboard' })
  productName!: string;

  @ApiProperty({ example: '49.90' })
  unitPrice!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;
}

class OrderLedgerEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: LedgerEntryType, example: LedgerEntryType.DEBIT })
  type!: LedgerEntryType;

  @ApiProperty({ example: '-99.80' })
  amount!: string;

  @ApiProperty({ example: '100.20' })
  balanceAfter!: string;

  @ApiProperty({ required: false, example: 'checkout:retry-key-1' })
  idempotencyKey?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  status!: OrderStatus;

  @ApiProperty({ example: '99.80' })
  totalAmount!: string;

  @ApiProperty({ required: false, example: 'checkout:retry-key-1' })
  idempotencyKey?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: OrderItemResponseDto, isArray: true })
  items!: OrderItemResponseDto[];

  @ApiProperty({ type: OrderLedgerEntryResponseDto, isArray: true })
  ledgerEntries!: OrderLedgerEntryResponseDto[];
}
