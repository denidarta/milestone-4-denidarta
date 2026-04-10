import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface AuthResponse {
	access_token: string;
}

interface AccountResponse {
	id: number;
	balance: string;
}

interface TransactionResponse {
	id: number;
}

interface PaginatedResponse<T> {
	data: T[];
}

describe('Transactions (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let token: string;
	let accountId: number;
	let transactionId: number;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
		);
		prisma = app.get(PrismaService);
		await app.init();

		await request(app.getHttpServer() as Parameters<typeof request>[0]).post('/auth/register').send({
			email: 'tx@example.com',
			password: 'password123',
			name: 'TX User',
		});
		const loginRes = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/auth/login')
			.send({ email: 'tx@example.com', password: 'password123' });
		token = (loginRes.body as AuthResponse).access_token;

		const accRes = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/accounts')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Savings', type: 'SAVINGS' });
		accountId = (accRes.body as AccountResponse).id;
	});

	afterAll(async () => {
		await prisma.transaction.deleteMany();
		await prisma.account.deleteMany();
		await prisma.user.deleteMany();
		await app.close();
	});

	it('POST /accounts/:id/transactions - creates a CREDIT transaction and updates balance', async () => {
		const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post(`/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: '500.00',
				type: 'CREDIT',
				description: 'Initial deposit',
			});
		expect(res.status).toBe(201);
		expect((res.body as TransactionResponse).id).toBeDefined();
		transactionId = (res.body as TransactionResponse).id;

		const acc = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get(`/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((acc.body as AccountResponse).balance)).toBe(500);
	});

	it('POST /accounts/:id/transactions - creates a DEBIT and reduces balance', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post(`/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`)
			.send({ amount: '100.00', type: 'DEBIT' });

		const acc = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get(`/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((acc.body as AccountResponse).balance)).toBe(400);
	});

	it('GET /accounts/:id/transactions - lists transactions (paginated)', async () => {
		const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get(`/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect((res.body as PaginatedResponse<TransactionResponse>).data).toHaveLength(2);
	});

	it('GET /transactions/:id - returns transaction detail', async () => {
		const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get(`/transactions/${transactionId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect((res.body as TransactionResponse).id).toBe(transactionId);
	});

	it('GET /transactions/:id - returns 404 for unknown id', async () => {
		const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get('/transactions/nonexistent-id')
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(404);
	});

	it('GET /transactions/:id - returns 403 for transaction owned by another user', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0]).post('/auth/register').send({
			email: 'txother@example.com',
			password: 'password123',
			name: 'Other User',
		});
		const otherRes = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/auth/login')
			.send({ email: 'txother@example.com', password: 'password123' });
		const otherToken = (otherRes.body as AuthResponse).access_token;

		const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
			.get(`/transactions/${transactionId}`)
			.set('Authorization', `Bearer ${otherToken}`);
		expect(res.status).toBe(403);
	});
});
