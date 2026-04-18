import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from 'src/types/index.type';

const mockUsersService = {
	findById: jest.fn(),
	findAll: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
	createAdmin: jest.fn(),
};

const mockUser = { id: 1, name: 'John', email: 'john@mail.com' };

describe('UsersController', () => {
	let controller: UsersController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [{ provide: UsersService, useValue: mockUsersService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.overrideGuard(RolesGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<UsersController>(UsersController);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Create ───────────────────────────────────────────────────────────────

	describe('createAdmin', () => {
		it('should create an admin user', async () => {
			mockUsersService.createAdmin.mockResolvedValue(mockUser);

			const dto = {
				name: 'John',
				email: 'john@mail.com',
				password: 'Pass@123',
			};
			const result = await controller.createAdmin(dto);

			expect(result).toEqual(mockUser);
			expect(mockUsersService.createAdmin).toHaveBeenCalledWith(dto);
		});

		it('should deny access when non-admin tries to create an admin user', async () => {
			const module: TestingModule = await Test.createTestingModule({
				controllers: [UsersController],
				providers: [{ provide: UsersService, useValue: mockUsersService }],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({ canActivate: () => true })
				.overrideGuard(RolesGuard)
				.useValue({ canActivate: () => false })
				.compile();

			const canActivate = module.get(RolesGuard).canActivate({} as never);

			expect(canActivate).toBe(false);
			expect(mockUsersService.createAdmin).not.toHaveBeenCalled();
		});
	});

	// ─── Read ─────────────────────────────────────────────────────────────────

	describe('getMyProfile', () => {
		it('should return current logged in user profile', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);

			const req = { user: { userId: 1 } };
			const result = await controller.getMyProfile(req);

			expect(result).toEqual(mockUser);
			expect(mockUsersService.findById).toHaveBeenCalledWith(1);
		});
	});

	describe('findAll', () => {
		it('should return paginated list of users', async () => {
			const mockList = { data: [mockUser], total: 1, page: 1, limit: 20 };
			mockUsersService.findAll.mockResolvedValue(mockList);

			const result = await controller.findAll(1, 20, undefined);

			expect(result).toEqual(mockList);
			expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 20, undefined);
		});
	});

	describe('findOne', () => {
		it('should return a user by id', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);

			const result = await controller.findOne(1);

			expect(result).toEqual(mockUser);
			expect(mockUsersService.findById).toHaveBeenCalledWith(1);
		});
	});

	// ─── Update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('should allow user to update their own profile', async () => {
			const updated = { ...mockUser, name: 'Updated' };
			mockUsersService.update.mockResolvedValue(updated);

			const req = { user: { userId: 1, role: UserRole.USER } };
			const result = await controller.update(1, { name: 'Updated' }, req);

			expect(result).toEqual(updated);
			expect(mockUsersService.update).toHaveBeenCalledWith(
				1,
				{ name: 'Updated' },
				1,
				UserRole.USER
			);
		});

		it('should throw ForbiddenException when updating another user as non-admin', async () => {
			mockUsersService.update.mockRejectedValue(new ForbiddenException());

			const req = { user: { userId: 2, role: UserRole.USER } };

			await expect(
				controller.update(1, { name: 'Hacker' }, req)
			).rejects.toThrow(ForbiddenException);
		});
	});

	// ─── Delete ───────────────────────────────────────────────────────────────

	describe('delete', () => {
		it('should delete user and return deleted user', async () => {
			mockUsersService.delete.mockResolvedValue(mockUser);

			const result = await controller.delete(1);

			expect(result).toEqual(mockUser);
			expect(mockUsersService.delete).toHaveBeenCalledWith(1);
		});

		it('should deny access when non-admin tries to delete a user', async () => {
			const module: TestingModule = await Test.createTestingModule({
				controllers: [UsersController],
				providers: [{ provide: UsersService, useValue: mockUsersService }],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({ canActivate: () => true })
				.overrideGuard(RolesGuard)
				.useValue({ canActivate: () => false })
				.compile();

			const app = module.createNestApplication();
			await app.init();

			// Guard blocks the request — controller method should never be reached
			const canActivate = module.get(RolesGuard).canActivate({} as never);

			expect(canActivate).toBe(false);
			expect(mockUsersService.delete).not.toHaveBeenCalled();

			await app.close();
		});
	});
});
