import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
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
		app.useGlobalPipes(
			new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
		);
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
				.send({
					email: 'test@example.com',
					password: 'password123',
					name: 'Test User',
				});
			expect(res.status).toBe(201);
			expect(res.body.access_token).toBeDefined();
		});

		it('should return 409 for duplicate email', async () => {
			const res = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
					name: 'Test User',
				});
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
});
