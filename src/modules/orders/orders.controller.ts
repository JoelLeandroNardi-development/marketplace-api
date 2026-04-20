import { Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_HEADER_LOWER,
} from '../../common/idempotency/idempotency-key';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Authenticated()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiHeader({
    name: IDEMPOTENCY_KEY_HEADER,
    description: 'Unique key that makes checkout retries safe',
  })
  @ApiOperation({
    summary: 'Checkout the current user cart using wallet balance',
  })
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Headers(IDEMPOTENCY_KEY_HEADER_LOWER) idempotencyKey: string,
  ) {
    return this.ordersService.createFromCart(user.id, idempotencyKey);
  }
}
