import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '@prisma/client';
import { LoginRateLimiterService } from './rate-limit/login-rate-limiter.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly loginRateLimiter: LoginRateLimiterService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailIsAvailable(email);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.createUserWithDefaults(
      dto.name,
      email,
      passwordHash,
    );

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(dto.email);
    await this.loginRateLimiter.consume(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async assertEmailIsAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
  }

  private createUserWithDefaults(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        cart: {
          create: {},
        },
        wallet: {
          create: {},
        },
      },
    });
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  }): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }
}
