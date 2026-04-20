import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a profile without password fields', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'joel@example.com',
      name: 'Joel',
      role: UserRole.CUSTOMER,
      createdAt,
    });

    await expect(service.getProfile('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'joel@example.com',
      name: 'Joel',
      role: UserRole.CUSTOMER,
      createdAt,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
