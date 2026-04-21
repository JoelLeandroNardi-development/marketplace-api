import { DocumentBuilder, type SwaggerDocumentOptions } from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Marketplace API')
    .setDescription('API documentation for the Marketplace application')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
}

export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) =>
    `${controllerKey}_${methodKey}`,
};
