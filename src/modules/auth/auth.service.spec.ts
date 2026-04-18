import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const mockUser = {
	id: 1,
	name: 'John Doe',
	email: 'john@example.com',
	password: '$2b$10$hashedpassword',
	role: UserRole.USER,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockUsersRepository = {
	findByEmail: jest.fn(),
	findByEmailWithPassword: jest.fn(),
	create: jest.fn(),
};

const mockJwtService = {
	signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
};

describe('AuthService', () => {
	let service: AuthService;
	let repository: typeof mockUsersRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersRepository, useValue: mockUsersRepository },
				{ provide: JwtService, useValue: mockJwtService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		repository = module.get(UsersRepository);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Register ─────────────────────────────────────────────────────────────

	describe('register', () => {
		const dto = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'Pass@123',
		};

		it('should register user and return access token', async () => {
			repository.findByEmail.mockResolvedValue(null);
			repository.create.mockResolvedValue(mockUser);

			const result = await service.register(dto);

			expect(result).toEqual({ access_token: 'mock.jwt.token' });
			expect(repository.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: dto.email,
					name: dto.name,
					role: UserRole.USER,
				})
			);
		});

		it('should throw ConflictException when email already in use', async () => {
			repository.findByEmail.mockResolvedValue(mockUser);

			await expect(service.register(dto)).rejects.toThrow(ConflictException);
			expect(repository.create).not.toHaveBeenCalled();
		});
	});

	// ─── Login ────────────────────────────────────────────────────────────────

	describe('login', () => {
		const dto = { email: 'john@example.com', password: 'Pass@123' };

		it('should login and return access token with correct credentials', async () => {
			const hash = await bcrypt.hash('Pass@123', 10);
			repository.findByEmailWithPassword.mockResolvedValue({
				...mockUser,
				password: hash,
			});

			const result = await service.login(dto);

			expect(result).toEqual({ access_token: 'mock.jwt.token' });
		});

		it('should throw UnauthorizedException when email not found', async () => {
			repository.findByEmailWithPassword.mockResolvedValue(null);

			await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException when password is wrong', async () => {
			repository.findByEmailWithPassword.mockResolvedValue({
				...mockUser,
				password: 'wronghash',
			});

			await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
		});
	});
});
