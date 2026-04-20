import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    private demoUserId = 'replace-this-with-a-real-user-id';

    @Get()
    @ApiOperation({ summary: 'Get current user cart' })
    getCart() {
        return this.cartService.getCartByUser(this.demoUserId);
    }

    @Post('items')
    @ApiOperation({ summary: 'Add item to cart' })
    addItem(@Body() dto: AddCartItemDto) {
        return this.cartService.addItem(this.demoUserId, dto);
    }
}
