# NestJS Financial Service API — Scaffold Design

**Date:** 2026-03-18

## Overview

A REST API backend for a financial service built with NestJS, PostgreSQL, and Prisma. The API manages users, accounts, and transactions with JWT-based authentication.

## Architecture

Feature-based NestJS modules. Each domain (`auth`, `users`, `accounts`, `transactions`) is an isolated module with its own controller, service, and DTOs. A shared `PrismaModule` provides database access across all feature modules.

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── accounts/
│   ├── accounts.module.ts
│   ├── accounts.controller.ts
│   ├── accounts.service.ts
│   └── dto/
├── transactions/
│   ├── transactions.module.ts
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── dto/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts

prisma/
└── schema.prisma

docker-compose.yml
.env.example
```

## Data Models

`type` fields use Prisma enums to prevent inconsistent values. `balance` and `amount` use `Decimal` with explicit precision (`@db.Decimal(19, 4)`) suitable for financial data. Account balance is maintained as a field and updated atomically within the same Prisma transaction when a transaction is created. `Transaction` intentionally omits `updatedAt` — transactions are immutable once created.

```prisma
enum AccountType {
  CHECKING
  SAVINGS
}

enum TransactionType {
  CREDIT
  DEBIT
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  accounts  Account[]
}

model Account {
  id           String          @id @default(uuid())
  name         String
  type         AccountType
  balance      Decimal         @default(0) @db.Decimal(19, 4)
  currency     String          @default("USD")
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  userId       String
  user         User            @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(uuid())
  amount      Decimal         @db.Decimal(19, 4)
  type        TransactionType
  description String?
  createdAt   DateTime        @default(now())
  accountId   String
  account     Account         @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

## Authentication

- JWT-based auth using `@nestjs/jwt` and `passport-jwt`
- Passwords hashed with `bcrypt` (salt rounds: 10)
- JWT guard applied per-route (explicit opt-in, not global)
- Token payload: `{ sub: userId, email }`
- Token expiry: `15m` (configurable via env). No refresh token flow in this scaffold — tokens are short-lived and re-login is required. This is intentional for simplicity.
- JWT secret minimum length: 32 characters

### Auth Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | Public | Create user, return JWT. Returns 409 if email already exists. |
| POST | `/auth/login` | Public | Validate credentials, return JWT. Returns 401 on invalid credentials. |

## API Endpoints

All protected endpoints enforce ownership: a user can only access their own accounts and transactions. Requests for resources belonging to another user return 403.

List endpoints support pagination via `?page=1&limit=20` query params (default: page 1, limit 20).

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/users/me` | JWT | Get current user profile |
| GET | `/accounts` | JWT | List user's accounts (paginated) |
| POST | `/accounts` | JWT | Create an account |
| GET | `/accounts/:id` | JWT | Get account details (403 if not owner) |
| DELETE | `/accounts/:id` | JWT | Delete account and cascade-delete its transactions |
| GET | `/accounts/:id/transactions` | JWT | List transactions for account (paginated) |
| POST | `/accounts/:id/transactions` | JWT | Create a transaction; atomically updates account balance |
| GET | `/transactions/:id` | JWT | Get transaction detail (403 if not owner) |

### Balance Update Logic

When `POST /accounts/:id/transactions` is called:
- `CREDIT` → `account.balance += amount`
- `DEBIT` → `account.balance -= amount` (no overdraft protection in this scaffold)

Balance update and transaction creation are executed in a single Prisma `$transaction` to ensure atomicity.

## Error Responses

All errors return a consistent shape:
```json
{ "statusCode": 400, "message": "...", "error": "Bad Request" }
```

| Status | Scenario |
|--------|----------|
| 400 | Validation failure (invalid DTO fields) |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not the resource owner |
| 404 | Resource not found |
| 409 | Duplicate email on register |

## main.ts Configuration

Global `ValidationPipe` registered with `whitelist: true` and `forbidNonWhitelisted: true` to strip unknown fields and reject invalid payloads early.

## Infrastructure

### Docker Setup
`docker-compose.yml` runs only the **PostgreSQL 15 container**. The NestJS app runs on the host machine (`npm run start:dev`). The app connects to Postgres via `DATABASE_URL` from `.env`.

### Environment Variables (`.env.example`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_db
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=15m
PORT=3000
```

## Dependencies

- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `@nestjs/config`
- `@prisma/client`, `prisma` (dev)
- `bcrypt`, `@types/bcrypt` (dev)
- `class-validator`, `class-transformer`
