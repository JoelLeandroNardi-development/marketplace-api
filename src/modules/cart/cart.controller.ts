import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CartItemRecord, CartService, CartWithItems } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  AddCartItemResponseDto,
  CartResponseDto,
} from './dto/cart-response.dto';

@ApiTags('Cart')
@Authenticated()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiOkResponse({
    description: 'Current authenticated user cart',
    type: CartResponseDto,
  })
  getCart(@CurrentUser() user: AuthenticatedUser): Promise<CartWithItems> {
    return this.cartService.getCartByUser(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiOkResponse({
    description: 'Cart item after quantity merge or creation',
    type: AddCartItemResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Product is missing, inactive, or quantity exceeds stock',
  })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ): Promise<CartItemRecord> {
    return this.cartService.addItem(user.id, dto);
  }
}
