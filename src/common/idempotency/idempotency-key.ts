import { BadRequestException } from '@nestjs/common';

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
export const IDEMPOTENCY_KEY_HEADER_LOWER = 'idempotency-key';

export function buildScopedIdempotencyKey(
  scope: string,
  rawKey: string | undefined,
  actionName: string,
) {
  const idempotencyKey = rawKey?.trim();

  if (!idempotencyKey) {
    throw new BadRequestException(
      `${IDEMPOTENCY_KEY_HEADER} header is required for ${actionName}`,
    );
  }

  return `${scope}:${idempotencyKey}`;
}
