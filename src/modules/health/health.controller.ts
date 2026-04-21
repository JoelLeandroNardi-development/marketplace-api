import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  LivenessResponseDto,
  ReadinessErrorResponseDto,
  ReadinessResponseDto,
} from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiOkResponse({
    description: 'Service process is alive',
    type: LivenessResponseDto,
  })
  liveness(): LivenessResponseDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiOkResponse({
    description: 'Dependencies required to serve traffic are healthy',
    type: ReadinessResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'One or more dependencies are unavailable',
    type: ReadinessErrorResponseDto,
  })
  async readiness(): Promise<ReadinessResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        checks: {
          database: 'ok',
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        message: 'Service is not ready',
        checks: {
          database: 'unavailable',
        },
      });
    }
  }
}
