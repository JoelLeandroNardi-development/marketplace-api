import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { LoginRateLimiterService } from './rate-limit/login-rate-limiter.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { sign: jest.Mock };
  let loginRateLimiter: { consume: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    loginRateLimiter = { consume: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: LoginRateLimiterService, useValue: loginRateLimiter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('creates a cart and wallet when registering a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Joel',
      email: 'joel@example.com',
      role: UserRole.CUSTOMER,
    });

    const result = await service.register({
      name: 'Joel',
      email: 'Joel@Example.com',
      password: 'secret123',
    });

    expect(result.accessToken).toBe('signed-token');
    const createCalls = prisma.user.create.mock.calls as [
      {
        data: {
          name: string;
          email: string;
          passwordHash: string;
          cart: { create: Record<string, never> };
          wallet: { create: Record<string, never> };
        };
      },
    ][];
    const createArgs = createCalls[0][0];

    expect(createArgs.data).toMatchObject({
      name: 'Joel',
      email: 'joel@example.com',
      cart: { create: {} },
      wallet: { create: {} },
    });
    expect(typeof createArgs.data.passwordHash).toBe('string');
  });

  it('rejects duplicate email registration', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        name: 'Joel',
        email: 'joel@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'joel@example.com',
      passwordHash: await bcrypt.hash('real-password', 4),
      role: UserRole.CUSTOMER,
      name: 'Joel',
    });

    await expect(
      service.login({
        email: 'joel@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
