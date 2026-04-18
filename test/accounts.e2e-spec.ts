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

interface PaginatedResponse<T> {
	data: T[];
}

describe('Accounts (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let token: string;
	let accountId: number;

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
				email: 'accounts@example.com',
				password: 'Password@123',
				name: 'Account User',
			});
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/auth/login')
			.send({ email: 'accounts@example.com', password: 'Password@123' });
		token = (res.body as AuthResponse).access_token;
	});

	afterAll(async () => {
		await prisma.account.deleteMany();
		await prisma.user.deleteMany();
		await app.close();
	});

	it('POST /api/v1/accounts - creates an account', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/accounts')
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(201);
		expect((res.body as AccountResponse).id).toBeDefined();
		expect(parseFloat((res.body as AccountResponse).balance)).toBe(0);
		accountId = (res.body as AccountResponse).id;
	});

	it('GET /api/v1/accounts - lists accounts for the user', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get('/api/v1/accounts')
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect((res.body as PaginatedResponse<AccountResponse>).data).toHaveLength(
			1
		);
	});

	it('GET /api/v1/accounts/:id - returns account details', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect((res.body as AccountResponse).id).toBe(accountId);
	});

	it('GET /api/v1/accounts/:id - returns 404 for unknown id', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get('/api/v1/accounts/999999')
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(404);
	});

	it('GET /api/v1/accounts/:id - returns 403 for account owned by another user', async () => {
		await request(app.getHttpServer() as Parameters<typeof request>[0])
			.post('/api/v1/auth/register')
			.send({
				email: 'other@example.com',
				password: 'Password@123',
				name: 'Other User',
			});
		const otherRes = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.post('/api/v1/auth/login')
			.send({ email: 'other@example.com', password: 'Password@123' });
		const otherToken = (otherRes.body as AuthResponse).access_token;

		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.get(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${otherToken}`);
		expect(res.status).toBe(403);
	});

	it('DELETE /api/v1/accounts/:id - deletes the account', async () => {
		const res = await request(
			app.getHttpServer() as Parameters<typeof request>[0]
		)
			.delete(`/api/v1/accounts/${accountId}`)
			.set('Authorization', `Bearer ${token}`);
		expect(res.status).toBe(200);
	});
});
