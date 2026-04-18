import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';
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

const mockAccountsRepository = {
	create: jest.fn(),
	findAll: jest.fn(),
	countAll: jest.fn(),
	findAllByUser: jest.fn(),
	findById: jest.fn(),
	findByNumber: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

describe('AccountsService', () => {
	let service: AccountsService;
	let repository: typeof mockAccountsRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountsService,
				{ provide: AccountsRepository, useValue: mockAccountsRepository },
			],
		}).compile();

		service = module.get<AccountsService>(AccountsService);
		repository = module.get(AccountsRepository);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		it('should create account with unique account number', async () => {
			mockAccountsRepository.findByNumber.mockResolvedValue(null);
			mockAccountsRepository.create.mockResolvedValue(mockAccount);

			const result = await service.create(1);

			expect(result).toEqual(mockAccount);
			expect(mockAccountsRepository.create).toHaveBeenCalledWith(
				expect.any(Number),
				1
			);
		});
	});

	// ─── Read ─────────────────────────────────────────────────────────────────

	describe('findAll', () => {
		it('should return paginated accounts', async () => {
			repository.findAll.mockResolvedValue([mockAccount]);
			repository.countAll.mockResolvedValue(1);

			const result = await service.findAll(1, 20);

			expect(result).toEqual({
				data: [mockAccount],
				total: 1,
				page: 1,
				limit: 20,
			});
		});

		it('should apply correct skip for page 2', async () => {
			repository.findAll.mockResolvedValue([]);
			repository.countAll.mockResolvedValue(0);

			await service.findAll(2, 10);

			expect(repository.findAll).toHaveBeenCalledWith(10, 10);
		});
	});

	describe('findAllByUser', () => {
		it('should return paginated accounts for a specific user', async () => {
			repository.findAllByUser.mockResolvedValue([[mockAccount], 1]);

			const result = await service.findAllByUser(1, 1, 20);

			expect(result).toEqual({
				data: [mockAccount],
				total: 1,
				page: 1,
				limit: 20,
			});
			expect(repository.findAllByUser).toHaveBeenCalledWith(1, 0, 20);
		});
	});

	describe('findById', () => {
		it('should return account when found and user is owner', async () => {
			mockAccountsRepository.findById.mockResolvedValue(mockAccount);

			const result = await service.findById(1, 1);

			expect(result).toEqual(mockAccount);
		});

		it('should return account when user is admin', async () => {
			mockAccountsRepository.findById.mockResolvedValue({
				...mockAccount,
				userId: 2,
			});

			const result = await service.findById(1, 1, UserRole.ADMIN);

			expect(result).toBeDefined();
		});

		it('should throw NotFoundException when account not found', async () => {
			mockAccountsRepository.findById.mockResolvedValue(null);

			await expect(service.findById(99, 1)).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when user is not owner', async () => {
			mockAccountsRepository.findById.mockResolvedValue({
				...mockAccount,
				userId: 2,
			});

			await expect(service.findById(1, 1)).rejects.toThrow(ForbiddenException);
		});
	});

	describe('findByAccountNumber', () => {
		it('should return account when found', async () => {
			const mockResult = { accountNumber: 1234567890, user: { name: 'John' } };
			repository.findByNumber.mockResolvedValue(mockResult);

			const result = await service.findByAccountNumber(1234567890);

			expect(result).toEqual(mockResult);
		});

		it('should throw NotFoundException when account number not found', async () => {
			repository.findByNumber.mockResolvedValue(null);

			await expect(service.findByAccountNumber(9999999999)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ─── Update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('should update account when user is owner', async () => {
			const updated = { ...mockAccount, status: AccountStatus.FROZEN };
			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			repository.update.mockResolvedValue(updated);

			const result = await service.update(1, 1, UserRole.USER, {
				status: AccountStatus.FROZEN,
			});

			expect(result).toEqual(updated);
		});

		it('should update account when user is admin', async () => {
			const updated = { ...mockAccount, status: AccountStatus.FROZEN };
			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			repository.update.mockResolvedValue(updated);

			const result = await service.update(1, 99, UserRole.ADMIN, {
				status: AccountStatus.FROZEN,
			});

			expect(result).toEqual(updated);
		});

		it('should throw NotFoundException when account not found', async () => {
			mockAccountsRepository.findById.mockResolvedValue(null);

			await expect(
				service.update(99, 1, UserRole.ADMIN, { status: AccountStatus.FROZEN })
			).rejects.toThrow(NotFoundException);
		});
	});

	// ─── Delete ───────────────────────────────────────────────────────────────

	describe('remove', () => {
		it('should delete account when user is owner', async () => {
			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			repository.delete.mockResolvedValue(mockAccount);

			const result = await service.remove(1, 1, UserRole.USER);

			expect(result).toEqual(mockAccount);
			expect(repository.delete).toHaveBeenCalledWith(1);
		});

		it('should throw ForbiddenException when user is not owner', async () => {
			mockAccountsRepository.findById.mockResolvedValue({
				...mockAccount,
				userId: 2,
			});

			await expect(service.remove(1, 1, UserRole.USER)).rejects.toThrow(
				ForbiddenException
			);
		});

		it('should throw NotFoundException when account not found', async () => {
			mockAccountsRepository.findById.mockResolvedValue(null);

			await expect(service.remove(99, 1, UserRole.USER)).rejects.toThrow(
				NotFoundException
			);
		});
	});
});
