import { Module } from '@nestjs/common';
import { LoginRateLimiterService } from './login-rate-limiter.service';

@Module({
  providers: [LoginRateLimiterService],
  exports: [LoginRateLimiterService],
})
export class RateLimitModule {}
