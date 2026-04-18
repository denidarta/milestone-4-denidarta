import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
	register: jest.fn(),
	login: jest.fn(),
};

const mockToken = { access_token: 'mock.jwt.token' };

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Register ─────────────────────────────────────────────────────────────

	describe('register', () => {
		const dto = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'Pass@123',
		};

		it('should return access token on successful registration', async () => {
			mockAuthService.register.mockResolvedValue(mockToken);

			const result = await controller.register(dto);

			expect(result).toEqual(mockToken);
			expect(mockAuthService.register).toHaveBeenCalledWith(dto);
		});

		it('should throw ConflictException when email already in use', async () => {
			mockAuthService.register.mockRejectedValue(
				new ConflictException('Email already in use')
			);

			await expect(controller.register(dto)).rejects.toThrow(ConflictException);
		});
	});

	// ─── Login ────────────────────────────────────────────────────────────────

	describe('login', () => {
		const dto = { email: 'john@example.com', password: 'Pass@123' };

		it('should return access token on successful login', async () => {
			mockAuthService.login.mockResolvedValue(mockToken);

			const result = await controller.login(dto);

			expect(result).toEqual(mockToken);
			expect(mockAuthService.login).toHaveBeenCalledWith(dto);
		});

		it('should throw UnauthorizedException when credentials are invalid', async () => {
			mockAuthService.login.mockRejectedValue(
				new UnauthorizedException('Invalid credentials')
			);

			await expect(controller.login(dto)).rejects.toThrow(
				UnauthorizedException
			);
		});
	});
});
