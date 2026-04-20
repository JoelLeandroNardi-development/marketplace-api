import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryBucket {
  count: number;
  expiresAt: number;
}

@Injectable()
export class LoginRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(LoginRateLimiterService.name);
  private readonly memoryBuckets = new Map<string, MemoryBucket>();
  private readonly maxAttempts = 5;
  private readonly windowSeconds = 60;
  private readonly redis?: Redis;

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    }
  }

  async consume(identifier: string): Promise<void> {
    const key = `login-attempts:${identifier.toLowerCase()}`;

    if (this.redis) {
      const consumed = await this.consumeRedis(key);

      if (consumed) {
        return;
      }
    }

    this.consumeMemory(key);
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }

  private async consumeRedis(key: string): Promise<boolean> {
    try {
      if (this.redis?.status === 'wait') {
        await this.redis.connect();
      }

      const attempts = await this.redis!.incr(key);

      if (attempts === 1) {
        await this.redis!.expire(key, this.windowSeconds);
      }

      if (attempts > this.maxAttempts) {
        throw new HttpException(
          'Too many login attempts. Please try again shortly.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === Number(HttpStatus.TOO_MANY_REQUESTS)
      ) {
        throw error;
      }

      this.logger.warn(
        'Redis rate limiting unavailable; using in-memory fallback',
      );
      return false;
    }
  }

  private consumeMemory(key: string): void {
    const now = Date.now();
    const existing = this.memoryBuckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.memoryBuckets.set(key, {
        count: 1,
        expiresAt: now + this.windowSeconds * 1000,
      });
      return;
    }

    existing.count += 1;

    if (existing.count > this.maxAttempts) {
      throw new HttpException(
        'Too many login attempts. Please try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
