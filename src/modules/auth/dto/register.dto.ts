import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Public display name of the user',
    example: 'Jane Doe',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Unique email address for the user account',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Password with minimum 6 characters',
    minLength: 6,
    example: 'secret123',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
