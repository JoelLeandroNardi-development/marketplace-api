import { Controller, Get } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@ApiTags('Users')
@Authenticated()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Current authenticated user profile',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }
}
