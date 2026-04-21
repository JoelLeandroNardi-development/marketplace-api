# Marketplace API

Small NestJS sandbox for practicing production-minded backend patterns:

- JWT authentication and role-based access control.
- Prisma/Postgres persistence.
- Product catalogue, cart, checkout, wallet, and immutable ledger entries.
- Idempotency keys for retry-safe money mutations.
- Redis-backed login rate limiting with an in-memory fallback for local development.
- Swagger docs, health checks, request IDs, structured error responses, and request logging.
- CI and AWS CDK scaffolding for deployment discussions.

## Local Setup

```bash
npm install
copy .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Swagger is available at:

```text
http://localhost:3000/docs
```

The raw OpenAPI document is available at:

```text
http://localhost:3000/docs/openapi.json
```

You can also generate a local `openapi.json` file at the repository root:

```bash
npm run openapi:generate
```

The API uses the global `/api` prefix.

## Useful Commands

```bash
npm run lint:check
npm run typecheck
npm run openapi:generate
npm run test
npm run test:e2e
npm run build
```

## Project Structure

```text
src/
  common/      Cross-cutting HTTP helpers, filters, interceptors, middleware.
  config/      Environment validation and application configuration.
  database/    Prisma infrastructure and database access module.
  modules/     Feature modules: auth, cart, categories, health, orders, products, users, wallet.
  app.module.ts
  main.ts
```

Feature code should usually live inside `src/modules/<feature>`. Shared framework concerns belong in `src/common`, and persistence infrastructure belongs in `src/database`.

## Main Flows

1. Register a user with `POST /api/auth/register`.
2. Login with `POST /api/auth/login`.
3. Inspect the current profile with `GET /api/users/me`.
4. Use the returned bearer token for protected routes.
5. Deposit sandbox funds with `POST /api/wallet/deposits` and an `Idempotency-Key` header.
6. Add products to the cart with `POST /api/cart/items`.
7. Checkout with `POST /api/orders/checkout` and an `Idempotency-Key` header.

## Notes

Admin-only endpoints currently rely on the `UserRole.ADMIN` role in the database. For local experiments, update a user role directly in Postgres or add a seed script.

The `infra/` folder is a learning scaffold. It sketches an API Gateway/Lambda deployment shape, but it is intentionally not a complete production deployment.
