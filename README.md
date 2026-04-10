# RevoBank API

A secure and scalable banking API built with NestJS and Prisma for managing user accounts, transactions, and financial operations.

## 🌐 Production

- **Base URL**: https://revobank-app-production.up.railway.app
- **Swagger Docs**: https://revobank-app-production.up.railway.app/api/docs

## 📋 Overview

RevoBank is a backend banking system designed for both customers and administrators. The API enables secure account management, fund transfers, deposits, withdrawals, and comprehensive transaction tracking with JWT-based authentication and role-based access control.

### Target Audience
- **Customers**: View account balances, perform transfers, monitor transaction history
- **Administrators**: Manage users, review transactions, oversee system operations

## ✨ Features

### 🔐 Authentication & Authorization
- User registration with password strength validation (uppercase, lowercase, numbers, special chars)
- JWT-based login with secure token generation
- Role-based access control (USER, ADMIN)
- Protected endpoints with JwtAuthGuard and RolesGuard
- Rate limiting (10 requests per 6 seconds)

### 👥 User Management
- User registration and login
- Profile management (view and update)
- User lookup and management (admin only)
- Secure password hashing with bcrypt

### 💳 Account Management
- Create multiple bank accounts per user
- Account status tracking (ACTIVE, FROZEN, CLOSED)
- Real-time balance management
- Unique account numbers
- Account lookup by number
- Full CRUD operations with role-based access

### 💰 Transactions
- **Deposit**: Add funds to account
- **Withdraw**: Withdraw funds with balance validation
- **Transfer**: Send funds between accounts with balance checks
- Transaction history with pagination
- Transaction details with source/destination account tracking
- Cascading transaction deletion on account removal

## 🛠 Technologies

- **Framework**: [NestJS](https://nestjs.com/) v11
- **ORM**: [Prisma](https://www.prisma.io/) v7
- **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com))
- **Authentication**: JWT with @nestjs/jwt & passport-jwt
- **Validation**: class-validator & class-transformer
- **Testing**: Jest & Supertest (E2E)
- **Documentation**: Swagger (@nestjs/swagger)
- **Containerization**: Docker
- **Deployment**: [Railway](https://railway.app) (Docker image via Docker Hub)
- **Node.js**: v20+

## 📦 Installation

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (or Supabase account)
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd milestone-4-denidarta
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

4. **Set up your database** in `.env`:
```env
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (used for migrations)
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# JWT configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="15m"

# Server
PORT=3000
```

5. **Run Prisma migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Seed database (optional)**
```bash
npx prisma db seed
```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```
Runs with hot-reload at `http://localhost:3000`

### Production Mode
```bash
npm run build
npm run start:prod
```

## 📚 API Documentation

Interactive Swagger documentation:
- **Local**: `http://localhost:3000/api/docs`
- **Production**: https://revobank-app-production.up.railway.app/api/docs

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT token |

### User Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/users/me` | Get current user profile | User |
| PATCH | `/api/v1/users/:id` | Update user profile | User |
| GET | `/api/v1/users` | List all users | Admin |
| GET | `/api/v1/users/:id` | Get user by ID | Admin |
| DELETE | `/api/v1/users/:id` | Delete user | Admin |
| POST | `/api/v1/users/admin` | Create admin user | Admin |

### Account Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/accounts` | Create account | User |
| GET | `/api/v1/accounts` | List user accounts (paginated) | User |
| GET | `/api/v1/accounts/:id` | Get account details | User |
| PATCH | `/api/v1/accounts/:id` | Update account status | User |
| DELETE | `/api/v1/accounts/:id` | Delete account | User |
| GET | `/api/v1/accounts/lookup/:accountNumber` | Lookup by account number | User |

### Transaction Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/accounts/:accountId/transactions` | Create transaction (deposit/withdraw/transfer) | User |
| GET | `/api/v1/accounts/:accountId/transactions` | Get account transactions (paginated) | User |
| GET | `/api/v1/transactions/:id` | Get transaction details | User |

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Generate Coverage Report
```bash
npm run test:cov
```

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/                 # Authentication & JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── users/                # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   ├── accounts/             # Bank account operations
│   │   ├── accounts.controller.ts
│   │   ├── accounts.service.ts
│   │   └── dto/
│   └── transactions/         # Transaction management
│       ├── transactions.controller.ts
│       ├── transactions.service.ts
│       └── dto/
├── common/
│   ├── guards/               # JWT & Role-based guards
│   ├── decorators/           # Custom decorators (@Roles, @CurrentUser)
│   └── utils/                # Helper functions
└── main.ts                   # Application entry point
prisma/
├── schema.prisma             # Database schema
├── migrations/               # Migration files
└── seed.ts                   # Database seeder
prisma.config.ts              # Prisma v7 configuration
```

## 🗄 Database Schema

### User
```
- id: Int (PK, autoincrement)
- email: String (UNIQUE)
- password: String (hashed)
- name: String
- role: UserRole (USER | ADMIN)
- createdAt, updatedAt
```

### Account
```
- id: Int (PK, autoincrement)
- accountNumber: Int (UNIQUE)
- status: AccountStatus (ACTIVE | FROZEN | CLOSED)
- balance: Decimal(19,4)
- userId: Int (FK)
- createdAt, updatedAt
```

### Transaction
```
- id: Int (PK, autoincrement)
- amount: Decimal(19,4)
- type: TransactionType (DEPOSIT | WITHDRAWAL | TRANSFER)
- description: String (nullable)
- sourceAccountId: Int (FK, nullable)
- destinationAccountId: Int (FK, nullable)
- createdAt
```

## 🔒 Security Features

- **Password Strength**: Enforced regex validation (uppercase, lowercase, digit, special char, min 8 chars)
- **JWT Token**: Secure token generation and validation
- **Role-Based Access**: Separate permissions for USER and ADMIN roles
- **Decimal Precision**: Proper decimal(19,4) for financial calculations
- **Rate Limiting**: Global throttle guard (10 req/6s)
- **Input Validation**: Global validation pipe with DTOs
- **Bcrypt Hashing**: 10-round password hashing

## 🚢 Deployment

This project is deployed on **Railway** using a Docker image hosted on Docker Hub.

### Build & Push Docker Image

```bash
# Build for linux/amd64 (required for Railway) and push in one command
docker buildx build --platform linux/amd64 -t denidarta/revobank:latest --push .
```

### Railway Environment Variables

Set these in your Railway service variables:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=15m
PORT=3000
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled, for runtime) |
| `DIRECT_URL` | PostgreSQL direct connection string (for migrations) |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | JWT token expiry (e.g. `15m`, `1h`) |
| `PORT` | Server port (default: 3000) |

## 📄 License

This project is [MIT licensed](LICENSE).
