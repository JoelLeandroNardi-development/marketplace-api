import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role!: UserRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
