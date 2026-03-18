# NestJS Financial Service API — Scaffold Design

**Date:** 2026-03-18

## Overview

A REST API backend for a financial service built with NestJS, PostgreSQL, and Prisma. The API manages users, accounts, and transactions with JWT-based authentication.

## Architecture

Feature-based NestJS modules. Each domain (`auth`, `users`, `accounts`, `transactions`) is an isolated module with its own controller, service, and DTOs. A shared `PrismaModule` provides database access across all feature modules.

## Project Structure

```
src/
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
└── main.ts

prisma/
└── schema.prisma

docker-compose.yml
.env.example
```

## Data Models

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  accounts  Account[]
}

model Account {
  id           String        @id @default(uuid())
  name         String
  type         String        // e.g. "checking", "savings"
  balance      Decimal       @default(0)
  currency     String        @default("USD")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  amount      Decimal
  type        String   // e.g. "credit", "debit"
  description String?
  createdAt   DateTime @default(now())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
}
```

## Authentication

- JWT-based auth using `@nestjs/jwt` and `passport-jwt`
- Passwords hashed with `bcrypt`
- JWT guard applied per-route (explicit opt-in, not global)
- Token payload: `{ sub: userId, email }`

### Auth Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | Public | Create user, return JWT |
| POST | `/auth/login` | Public | Validate credentials, return JWT |

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/users/me` | JWT | Get current user profile |
| GET | `/accounts` | JWT | List user's accounts |
| POST | `/accounts` | JWT | Create an account |
| GET | `/accounts/:id` | JWT | Get account details |
| DELETE | `/accounts/:id` | JWT | Delete an account |
| GET | `/accounts/:id/transactions` | JWT | List transactions for account |
| POST | `/accounts/:id/transactions` | JWT | Create a transaction |
| GET | `/transactions/:id` | JWT | Get transaction detail |

## Infrastructure

### docker-compose.yml
- PostgreSQL 15 container
- App service reads `DATABASE_URL` from `.env`

### Environment Variables (`.env.example`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_db
JWT_SECRET=your_jwt_secret
PORT=3000
```

## Dependencies

- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- `@prisma/client`, `prisma` (dev)
- `bcrypt`, `class-validator`, `class-transformer`
- `@nestjs/config`
