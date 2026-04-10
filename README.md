# RevoBank API

A secure and scalable banking API built with NestJS and Prisma for managing user accounts, transactions, and financial operations.

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

- **Framework**: [NestJS](https://nestjs.com/) 10.3.9
- **ORM**: [Prisma](https://www.prisma.io/) 5.x
- **Database**: PostgreSQL / MySQL / SQLite
- **Authentication**: JWT with @nestjs/jwt & passport-jwt
- **Validation**: class-validator & class-transformer
- **Testing**: Jest & Supertest (E2E)
- **Documentation**: Swagger (@nestjs/swagger)
- **Containerization**: Docker & Docker Compose
- **Node.js**: v20+

## 📦 Installation

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL / MySQL / SQLite
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
# PostgreSQL example
DATABASE_URL="postgresql://user:password@localhost:5432/revobank"

# MySQL example
DATABASE_URL="mysql://user:password@localhost:3306/revobank"

# SQLite example
DATABASE_URL="file:./dev.db"

# JWT configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
```

5. **Run Prisma migrations**
```bash
npx prisma migrate dev
```

6. **Seed database (optional)**
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

### Using Docker Compose
```bash
docker-compose up -d
```
This starts both PostgreSQL and the NestJS application.

## 📚 API Documentation

Interactive Swagger documentation available at: `http://localhost:3000/api/docs`

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

Coverage includes:
- Authentication (register, login, token validation)
- User management (profile, CRUD)
- Account operations (create, read, update, delete)
- Transaction handling (deposit, withdraw, transfer, balance validation)
- Authorization & error handling (401, 403, 404 responses)

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
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration files
├── config/
│   └── database.config.ts    # Database configuration
└── main.ts                   # Application entry point
```

## 🗄 Database Schema

### User
```
- id: Int (PK)
- email: String (UNIQUE)
- password: String (hashed)
- name: String
- role: UserRole (USER | ADMIN)
- createdAt, updatedAt
```

### Account
```
- id: Int (PK)
- accountNumber: String (UNIQUE)
- status: AccountStatus (ACTIVE | FROZEN | CLOSED)
- balance: Decimal(19,4)
- userId: Int (FK)
- createdAt, updatedAt
```

### Transaction
```
- id: Int (PK)
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

### Docker Deployment
```bash
# Build image
docker build -t revobank .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Cloud Deployment Options

#### Render
1. Push repository to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect GitHub repository
4. Set environment variables (DATABASE_URL, JWT_SECRET)
5. Deploy

#### Railway
1. Connect GitHub repository to [Railway](https://railway.app)
2. Add PostgreSQL plugin
3. Set environment variables
4. Deploy

#### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

## 📝 Environment Variables

Create `.env` file in root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/revobank"

# JWT Configuration
JWT_SECRET="your-secure-secret-key-with-at-least-32-characters"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV=development
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/YourFeature`
2. Commit changes: `git commit -m 'Add YourFeature'`
3. Push to branch: `git push origin feature/YourFeature`
4. Open a Pull Request

## 📄 License

This project is [MIT licensed](LICENSE).
