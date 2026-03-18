# NestJS Financial Service API — Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a NestJS REST API for a financial service with JWT auth, PostgreSQL via Prisma, and three feature modules: users, accounts, and transactions.

**Architecture:** Feature-based NestJS modules, each with controller/service/DTOs. A shared PrismaModule provides DB access. JWT guard is applied per-route. Account balance is updated atomically in a Prisma transaction when a transaction record is created.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL 15, Docker (Postgres only), bcrypt, passport-jwt, class-validator

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/main.ts` | Bootstrap app, register global ValidationPipe |
| `src/app.module.ts` | Root module, imports all feature modules |
| `src/prisma/prisma.service.ts` | PrismaClient wrapper, lifecycle hooks |
| `src/prisma/prisma.module.ts` | Global Prisma module |
| `prisma/schema.prisma` | DB schema: User, Account, Transaction enums/models |
| `src/auth/auth.module.ts` | Auth module imports |
| `src/auth/auth.service.ts` | register, login, JWT signing |
| `src/auth/auth.controller.ts` | POST /auth/register, POST /auth/login |
| `src/auth/jwt.strategy.ts` | Passport JWT strategy |
| `src/auth/jwt-auth.guard.ts` | JWT guard for protecting routes |
| `src/auth/dto/register.dto.ts` | Register input validation |
| `src/auth/dto/login.dto.ts` | Login input validation |
| `src/users/users.module.ts` | Users module imports |
| `src/users/users.service.ts` | findById |
| `src/users/users.controller.ts` | GET /users/me |
| `src/accounts/accounts.module.ts` | Accounts module imports |
| `src/accounts/accounts.service.ts` | create, findAll, findOne, remove |
| `src/accounts/accounts.controller.ts` | CRUD routes for accounts |
| `src/accounts/dto/create-account.dto.ts` | Account creation validation |
| `src/transactions/transactions.module.ts` | Transactions module imports |
| `src/transactions/transactions.service.ts` | create, findAll, findOne (with ownership check) |
| `src/transactions/transactions.controller.ts` | Transaction routes |
| `src/transactions/dto/create-transaction.dto.ts` | Transaction creation validation |
| `docker-compose.yml` | PostgreSQL 15 container |
| `.env.example` | Environment variable template |
| `test/auth.e2e-spec.ts` | E2E tests for auth endpoints |
| `test/accounts.e2e-spec.ts` | E2E tests for accounts endpoints |
| `test/transactions.e2e-spec.ts` | E2E tests for transactions endpoints |

---

## Task 1: Initialize NestJS Project & Install Dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `nest-cli.json` (via CLI)
- Create: `.env.example`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create NestJS project**

```bash
cd /Users/denidarta/codebase/milestone-4-denidarta
npx @nestjs/cli new . --package-manager npm --skip-git
```

When prompted for package manager, choose `npm`. When asked about overwriting, confirm yes.

- [ ] **Step 2: Install required dependencies**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/config bcrypt class-validator class-transformer @prisma/client
npm install --save-dev prisma @types/passport-jwt @types/bcrypt
```

- [ ] **Step 3: Create `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_db
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_EXPIRES_IN=15m
PORT=3000
```

- [ ] **Step 4: Create `.env` from example**

```bash
cp .env.example .env
```

Edit `.env` and set a real `JWT_SECRET` (at least 32 chars), e.g. `supersecretjwtkeyfordevonly12345678`.

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: financial_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 6: Start Postgres**

```bash
docker-compose up -d
```

Expected: container `milestone-4-denidarta-postgres-1` running.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: initialize NestJS project with dependencies and docker-compose"
```

---

## Task 2: Prisma Setup & Schema

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `src/prisma/prisma.service.ts`
- Create: `src/prisma/prisma.module.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` and `.env` updated with `DATABASE_URL` placeholder.

- [ ] **Step 2: Write schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration applied, Prisma client generated.

- [ ] **Step 4: Create `src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 5: Create `src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 6: Update `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Update `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 8: Verify app starts**

```bash
npm run start:dev
```

Expected: `Application is running on: http://[::1]:3000` — no errors.

- [ ] **Step 9: Commit**

```bash
git add prisma/ src/prisma/ src/app.module.ts src/main.ts
git commit -m "feat: add Prisma schema, PrismaService, and global ValidationPipe"
```

---

## Task 3: Auth Module (register & login)

**Files:**
- Create: `src/auth/dto/register.dto.ts`
- Create: `src/auth/dto/login.dto.ts`
- Create: `src/auth/jwt.strategy.ts`
- Create: `src/auth/jwt-auth.guard.ts`
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/auth.module.ts`
- Test: `test/auth.e2e-spec.ts`

- [ ] **Step 1: Write failing E2E test for register**

Create `test/auth.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });
      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });
      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid payload', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=auth.e2e --config jest-e2e.json
```

Expected: FAIL — `Cannot find module '../src/auth/auth.module'`

- [ ] **Step 3: Create DTOs**

`src/auth/dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}
```

`src/auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 4: Create JWT strategy and guard**

`src/auth/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

`src/auth/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 5: Create AuthService**

`src/auth/auth.service.ts`:
```typescript
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hash, name: dto.name },
    });

    return this.signToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email);
  }

  private signToken(userId: string, email: string) {
    return this.jwt.signAsync(
      { sub: userId, email },
    ).then((access_token) => ({ access_token }));
  }
}
```

- [ ] **Step 6: Create AuthController**

`src/auth/auth.controller.ts`:
```typescript
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
```

- [ ] **Step 7: Create AuthModule and wire into AppModule**

`src/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
```

Add `AuthModule` to `src/app.module.ts` imports array.

- [ ] **Step 8: Run tests and verify they pass**

```bash
npx jest --testPathPattern=auth.e2e --config jest-e2e.json
```

Expected: all 5 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/auth/ src/app.module.ts test/auth.e2e-spec.ts
git commit -m "feat: add auth module with register and login endpoints"
```

---

## Task 4: Users Module

**Files:**
- Create: `src/users/users.service.ts`
- Create: `src/users/users.controller.ts`
- Create: `src/users/users.module.ts`

- [ ] **Step 1: Write failing test for GET /users/me**

Add to `test/auth.e2e-spec.ts` inside the describe block, after the login tests:

```typescript
describe('GET /users/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    token = res.body.access_token;
  });

  it('should return current user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.password).toBeUndefined();
  });

  it('should return 401 without token', async () => {
    const res = await request(app.getHttpServer()).get('/users/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=auth.e2e --config jest-e2e.json
```

Expected: FAIL — 404 for `/users/me`.

- [ ] **Step 3: Create UsersService**

`src/users/users.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }
}
```

- [ ] **Step 4: Create UsersController**

`src/users/users.controller.ts`:
```typescript
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: { user: { userId: string } }) {
    return this.users.findById(req.user.userId);
  }
}
```

- [ ] **Step 5: Create UsersModule and wire into AppModule**

`src/users/users.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Add `UsersModule` to `src/app.module.ts` imports.

- [ ] **Step 6: Run tests and verify they pass**

```bash
npx jest --testPathPattern=auth.e2e --config jest-e2e.json
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/users/ src/app.module.ts test/auth.e2e-spec.ts
git commit -m "feat: add users module with GET /users/me endpoint"
```

---

## Task 5: Accounts Module

**Files:**
- Create: `src/accounts/dto/create-account.dto.ts`
- Create: `src/accounts/accounts.service.ts`
- Create: `src/accounts/accounts.controller.ts`
- Create: `src/accounts/accounts.module.ts`
- Test: `test/accounts.e2e-spec.ts`

- [ ] **Step 1: Write failing E2E tests**

Create `test/accounts.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Accounts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let accountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    await app.init();

    // Register and login
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'accounts@example.com', password: 'password123', name: 'Account User' });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'accounts@example.com', password: 'password123' });
    token = res.body.access_token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('POST /accounts - creates an account', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Checking', type: 'CHECKING' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.balance).toBe('0');
    accountId = res.body.id;
  });

  it('GET /accounts - lists accounts for the user', async () => {
    const res = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /accounts/:id - returns account details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(accountId);
  });

  it('GET /accounts/:id - returns 404 for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/accounts/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /accounts/:id - deletes the account', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=accounts.e2e --config jest-e2e.json
```

Expected: FAIL — 404 for `/accounts`.

- [ ] **Step 3: Create DTO**

`src/accounts/dto/create-account.dto.ts`:
```typescript
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;
}
```

- [ ] **Step 4: Create AccountsService**

`src/accounts/accounts.service.ts`:
```typescript
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.account.findMany({ where: { userId }, skip, take: limit }),
      this.prisma.account.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException();
    return account;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.account.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Create AccountsController**

`src/accounts/accounts.controller.ts`:
```typescript
import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateAccountDto) {
    return this.accounts.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accounts.findAll(req.user.userId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.accounts.findOne(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.accounts.remove(id, req.user.userId);
  }
}
```

- [ ] **Step 6: Create AccountsModule and wire into AppModule**

`src/accounts/accounts.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

@Module({
  providers: [AccountsService],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
```

Add `AccountsModule` to `src/app.module.ts` imports.

- [ ] **Step 7: Run tests and verify they pass**

```bash
npx jest --testPathPattern=accounts.e2e --config jest-e2e.json
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/accounts/ src/app.module.ts test/accounts.e2e-spec.ts
git commit -m "feat: add accounts module with CRUD endpoints"
```

---

## Task 6: Transactions Module

**Files:**
- Create: `src/transactions/dto/create-transaction.dto.ts`
- Create: `src/transactions/transactions.service.ts`
- Create: `src/transactions/transactions.controller.ts`
- Create: `src/transactions/transactions.module.ts`
- Test: `test/transactions.e2e-spec.ts`

- [ ] **Step 1: Write failing E2E tests**

Create `test/transactions.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let accountId: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    await app.init();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'tx@example.com', password: 'password123', name: 'TX User' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'tx@example.com', password: 'password123' });
    token = loginRes.body.access_token;

    const accRes = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Savings', type: 'SAVINGS' });
    accountId = accRes.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('POST /accounts/:id/transactions - creates a CREDIT transaction and updates balance', async () => {
    const res = await request(app.getHttpServer())
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '500.00', type: 'CREDIT', description: 'Initial deposit' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    transactionId = res.body.id;

    const acc = await request(app.getHttpServer())
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(acc.body.balance).toBe('500.0000');
  });

  it('POST /accounts/:id/transactions - creates a DEBIT and reduces balance', async () => {
    await request(app.getHttpServer())
      .post(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '100.00', type: 'DEBIT' });

    const acc = await request(app.getHttpServer())
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(acc.body.balance).toBe('400.0000');
  });

  it('GET /accounts/:id/transactions - lists transactions (paginated)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/accounts/${accountId}/transactions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('GET /transactions/:id - returns transaction detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(transactionId);
  });

  it('GET /transactions/:id - returns 404 for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=transactions.e2e --config jest-e2e.json
```

Expected: FAIL — 404 for transaction endpoints.

- [ ] **Step 3: Create DTO**

`src/transactions/dto/create-transaction.dto.ts`:
```typescript
import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsNumberString()
  amount: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;
}
```

- [ ] **Step 4: Create TransactionsService**

`src/transactions/transactions.service.ts`:
```typescript
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private accounts: AccountsService,
  ) {}

  async create(accountId: string, userId: string, dto: CreateTransactionDto) {
    // Verify ownership
    await this.accounts.findOne(accountId, userId);

    const { Prisma } = await import('@prisma/client');
    const balanceDelta = dto.type === TransactionType.CREDIT
      ? new Prisma.Decimal(dto.amount)
      : new Prisma.Decimal(dto.amount).negated();

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { accountId, amount: dto.amount, type: dto.type, description: dto.description },
      });
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: balanceDelta } },
      });
      return transaction;
    });
  }

  async findAll(accountId: string, userId: string, page = 1, limit = 20) {
    await this.accounts.findOne(accountId, userId);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({ where: { accountId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.transaction.count({ where: { accountId } }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.account.userId !== userId) throw new ForbiddenException();
    return transaction;
  }
}
```

- [ ] **Step 5: Create TransactionsController**

`src/transactions/transactions.controller.ts`:
```typescript
import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @Post('accounts/:accountId/transactions')
  create(
    @Param('accountId') accountId: string,
    @Request() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(accountId, req.user.userId, dto);
  }

  @Get('accounts/:accountId/transactions')
  findAll(
    @Param('accountId') accountId: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactions.findAll(accountId, req.user.userId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('transactions/:id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.transactions.findOne(id, req.user.userId);
  }
}
```

- [ ] **Step 6: Create TransactionsModule and wire into AppModule**

`src/transactions/transactions.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
```

Add `TransactionsModule` to `src/app.module.ts` imports.

- [ ] **Step 7: Run tests and verify they pass**

```bash
npx jest --testPathPattern=transactions.e2e --config jest-e2e.json
```

Expected: all tests PASS.

- [ ] **Step 8: Run all E2E tests**

```bash
npx jest --config jest-e2e.json
```

Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/transactions/ src/app.module.ts test/transactions.e2e-spec.ts
git commit -m "feat: add transactions module with balance update logic"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Start the app and verify it runs**

```bash
npm run start:dev
```

Expected: no errors, app listens on port 3000.

- [ ] **Step 2: Run all tests**

```bash
npx jest --config jest-e2e.json --verbose
```

Expected: all tests pass.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete NestJS financial service API scaffold"
```
