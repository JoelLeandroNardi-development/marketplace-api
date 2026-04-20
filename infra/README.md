# Marketplace API AWS Sandbox

This folder is intentionally small. It gives you a place to practice the AWS shape from the VIALET role without pretending this sandbox is already production infrastructure.

The target architecture is:

- API Gateway HTTP API in front of a Lambda-hosted NestJS application.
- Secrets Manager or SSM Parameter Store for `DATABASE_URL` and `JWT_SECRET`.
- ElastiCache Redis for login rate limiting.
- RDS Postgres for Prisma.
- CloudWatch logs and alarms for operational feedback.

Start by using this folder to discuss tradeoffs. Only wire real AWS resources when you are ready to pay for them and tear them down safely.
