import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { UserRole } from 'src/types/index.type';

const mockAccount = {
	id: 1,
	accountNumber: 1234567890,
	status: AccountStatus.ACTIVE,
	balance: new Decimal(1000),
	userId: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockAccountsService = {
	create: jest.fn(),
	findAll: jest.fn(),
	findAllByUser: jest.fn(),
	findById: jest.fn(),
	findByAccountNumber: jest.fn(),
	update: jest.fn(),
	remove: jest.fn(),
};

const adminUser = { userId: 1, role: UserRole.ADMIN };
const regularUser = { userId: 1, role: UserRole.USER };

describe('AccountsController', () => {
	let controller: AccountsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AccountsController],
			providers: [{ provide: AccountsService, useValue: mockAccountsService }],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<AccountsController>(AccountsController);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		it('should create and return new account', async () => {
			mockAccountsService.create.mockResolvedValue(mockAccount);

			const result = await controller.create(regularUser);

			expect(result).toEqual(mockAccount);
			expect(mockAccountsService.create).toHaveBeenCalledWith(1);
		});
	});

	// ─── Read ─────────────────────────────────────────────────────────────────

	describe('findAll', () => {
		it('should return all accounts for admin', async () => {
			const mockList = { data: [mockAccount], total: 1, page: 1, limit: 20 };
			mockAccountsService.findAll.mockResolvedValue(mockList);

			const result = await controller.findAll(adminUser, { page: 1, limit: 20 });

			expect(result).toEqual(mockList);
			expect(mockAccountsService.findAll).toHaveBeenCalledWith(1, 20);
		});

		it('should return only own accounts for regular user', async () => {
			const mockList = { data: [mockAccount], total: 1, page: 1, limit: 20 };
			mockAccountsService.findAllByUser.mockResolvedValue(mockList);

			const result = await controller.findAll(regularUser, { page: 1, limit: 20 });

			expect(result).toEqual(mockList);
			expect(mockAccountsService.findAllByUser).toHaveBeenCalledWith(1, 1, 20);
		});

		it('should filter by userId when admin provides userId query', async () => {
			const mockList = { data: [mockAccount], total: 1, page: 1, limit: 20 };
			mockAccountsService.findAllByUser.mockResolvedValue(mockList);

			const result = await controller.findAll(
				adminUser,
				{ page: 1, limit: 20 },
				'2'
			);

			expect(mockAccountsService.findAllByUser).toHaveBeenCalledWith(2, 1, 20);
			expect(result).toEqual(mockList);
		});
	});

	describe('findByNumber', () => {
		it('should return account by account number', async () => {
			const mockResult = { accountNumber: 1234567890, user: { name: 'John' } };
			mockAccountsService.findByAccountNumber.mockResolvedValue(mockResult);

			const result = await controller.findByNumber(1234567890);

			expect(result).toEqual(mockResult);
			expect(mockAccountsService.findByAccountNumber).toHaveBeenCalledWith(
				1234567890
			);
		});
	});

	describe('findOne', () => {
		it('should return account by id', async () => {
			mockAccountsService.findById.mockResolvedValue(mockAccount);

			const result = await controller.findOne(1, regularUser);

			expect(result).toEqual(mockAccount);
			expect(mockAccountsService.findById).toHaveBeenCalledWith(
				1,
				1,
				UserRole.USER
			);
		});
	});

	// ─── Update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('should update and return updated account', async () => {
			const updated = { ...mockAccount, status: AccountStatus.FROZEN };
			mockAccountsService.update.mockResolvedValue(updated);

			const result = await controller.update(1, regularUser, {
				status: AccountStatus.FROZEN,
			});

			expect(result).toEqual(updated);
			expect(mockAccountsService.update).toHaveBeenCalledWith(
				1,
				1,
				UserRole.USER,
				{ status: AccountStatus.FROZEN }
			);
		});
	});

	// ─── Delete ───────────────────────────────────────────────────────────────

	describe('remove', () => {
		it('should delete and return deleted account', async () => {
			mockAccountsService.remove.mockResolvedValue(mockAccount);

			const result = await controller.remove(1, regularUser);

			expect(result).toEqual(mockAccount);
			expect(mockAccountsService.remove).toHaveBeenCalledWith(
				1,
				1,
				UserRole.USER
			);
		});
	});
});
