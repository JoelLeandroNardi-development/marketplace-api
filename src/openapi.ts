/* eslint-disable @typescript-eslint/no-require-imports */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import {
  buildSwaggerConfig,
  swaggerDocumentOptions,
} from './config/swagger.config';

async function generateOpenApi(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/marketplace';
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'openapi-docs-jwt-secret-value-32-characters';
  }

  let app: INestApplication | undefined;

  try {
    // ts-node with nodenext resolves this path reliably through require.
    const { AppModule } =
      require('./app.module') as typeof import('./app.module');

    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    app.setGlobalPrefix('api');

    const document = SwaggerModule.createDocument(
      app,
      buildSwaggerConfig(),
      swaggerDocumentOptions,
    );

    const outputPath = join(process.cwd(), 'openapi.json');
    await writeFile(
      outputPath,
      `${JSON.stringify(document, null, 2)}\n`,
      'utf8',
    );
  } catch (error: unknown) {
    console.error('OpenAPI generation failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (app) {
      await app.close();
    }
  }
}

void generateOpenApi();
