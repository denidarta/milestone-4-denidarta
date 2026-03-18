import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    prisma = app.get(PrismaService);
    await app.init();

    // Register and login
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'accounts@example.com',
      password: 'password123',
      name: 'Account User',
    });
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

  it('GET /accounts/:id - returns 403 for account owned by another user', async () => {
    // Register a second user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'other@example.com',
      password: 'password123',
      name: 'Other User',
    });
    const otherRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'other@example.com', password: 'password123' });
    const otherToken = otherRes.body.access_token;

    const res = await request(app.getHttpServer())
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /accounts/:id - deletes the account', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
