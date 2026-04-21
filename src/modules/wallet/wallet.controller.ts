import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_HEADER_LOWER,
} from '../../common/idempotency/idempotency-key';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { DepositDto } from './dto/deposit.dto';
import {
  WalletLedgerEntry,
  WalletService,
  WalletWithEntries,
} from './wallet.service';
import {
  WalletLedgerEntryResponseDto,
  WalletResponseDto,
} from './dto/wallet-response.dto';

@ApiTags('Wallet')
@Authenticated()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user wallet and recent ledger entries',
  })
  @ApiOkResponse({
    description: 'Wallet with latest ledger entries',
    type: WalletResponseDto,
  })
  getWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WalletWithEntries> {
    return this.walletService.getWallet(user.id);
  }

  @Post('deposits')
  @ApiHeader({
    name: IDEMPOTENCY_KEY_HEADER,
    description: 'Unique key that makes deposit retries safe',
  })
  @ApiOperation({
    summary: 'Deposit sandbox funds into the current user wallet',
  })
  @ApiOkResponse({
    description:
      'Created or previously created deposit ledger entry for the same idempotency key',
    type: WalletLedgerEntryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing idempotency key or invalid amount',
  })
  deposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DepositDto,
    @Headers(IDEMPOTENCY_KEY_HEADER_LOWER) idempotencyKey: string,
  ): Promise<WalletLedgerEntry> {
    return this.walletService.deposit(user.id, dto, idempotencyKey);
  }
}
