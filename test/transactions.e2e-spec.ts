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
	let destAccountId: number;
	let transactionId: number;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix('api/v1');
		app.useGlobalPipes(
			new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
		);
		prisma = app.get(PrismaService);
		await app.init();

		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/api/v1/auth/register')
			.send({
				email: 'tx@example.com',
				password: 'Password@123',
				name: 'TX User',
			});
		const loginRes = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/auth/login')
			.send({ email: 'tx@example.com', password: 'Password@123' });
		token = (loginRes.body as AuthResponse).access_token;

		const accRes = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/accounts')
			.set('Authorization', `Bearer ${token}`);
		accountId = (accRes.body as AccountResponse).id;

		const destRes = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/accounts')
			.set('Authorization', `Bearer ${token}`);
		destAccountId = (destRes.body as AccountResponse).id;
	});

	afterAll(async () => {
		await prisma.transaction.deleteMany();
		await prisma.account.deleteMany();
		await prisma.user.deleteMany();
		await app.close();
	});

	it('POST /api/v1/accounts/:id/transactions - DEPOSIT updates balance', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post(`/api/v1/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: '500.00',
				type: 'DEPOSIT',
				description: 'Initial deposit',
			});
		expect(res.status).toBe(201);
		expect((res.body as TransactionResponse).id).toBeDefined();
		transactionId = (res.body as TransactionResponse).id;

		const acc = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((acc.body as AccountResponse).balance)).toBe(500);
	});

	it('POST /api/v1/accounts/:id/transactions - WITHDRAWAL reduces balance', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post(`/api/v1/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`)
			.send({ amount: '100.00', type: 'WITHDRAWAL' });

		const acc = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((acc.body as AccountResponse).balance)).toBe(400);
	});

	it('POST /api/v1/accounts/:id/transactions - TRANSFER moves balance between accounts', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post(`/api/v1/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				amount: '100.00',
				type: 'TRANSFER',
				destinationAccountId: destAccountId,
			});

		const src = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((src.body as AccountResponse).balance)).toBe(300);

		const dest = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${destAccountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(parseFloat((dest.body as AccountResponse).balance)).toBe(100);
	});

	it('GET /api/v1/accounts/:id/transactions - lists transactions (paginated)', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}/transactions`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(
			(res.body as PaginatedResponse<TransactionResponse>).data.length
		).toBeGreaterThanOrEqual(3);
	});

	it('GET /api/v1/transactions/:id - returns transaction detail', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/transactions/${transactionId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect((res.body as TransactionResponse).id).toBe(transactionId);
	});

	it('GET /api/v1/transactions/:id - returns 404 for unknown id', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get('/api/v1/transactions/999999')
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(404);
	});

	it('GET /api/v1/transactions/:id - returns 403 for transaction owned by another user', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/api/v1/auth/register')
			.send({
				email: 'txother@example.com',
				password: 'Password@123',
				name: 'Other User',
			});
		const otherRes = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/auth/login')
			.send({ email: 'txother@example.com', password: 'Password@123' });
		const otherToken = (otherRes.body as AuthResponse).access_token;

		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/transactions/${transactionId}`)
			.set('Authorization', `Bearer ${otherToken}`);
		expect(res.status).toBe(403);
	});
});
