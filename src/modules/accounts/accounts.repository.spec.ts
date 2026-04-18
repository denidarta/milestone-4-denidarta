import { Test, TestingModule } from '@nestjs/testing';
import { AccountsRepository } from './accounts.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/__mocks__/prisma.service';
import { AccountStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

const mockAccount = {
	id: 1,
	accountNumber: 1234567890,
	status: AccountStatus.ACTIVE,
	balance: new Decimal(1000),
	userId: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe('AccountsRepository', () => {
	let repository: AccountsRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountsRepository,
				{ provide: PrismaService, useValue: mockPrismaService },
			],
		}).compile();

		repository = module.get<AccountsRepository>(AccountsRepository);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		it('should create and return account', async () => {
			mockPrismaService.account.create.mockResolvedValue(mockAccount);

			const result = await repository.create(1234567890, 1);

			expect(result).toEqual(mockAccount);
			expect(mockPrismaService.account.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: { accountNumber: 1234567890, userId: 1 },
				})
			);
		});
	});

	// ─── Read ─────────────────────────────────────────────────────────────────

	describe('findAll', () => {
		it('should return paginated accounts', async () => {
			mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

			const result = await repository.findAll(0, 20);

			expect(result).toEqual([mockAccount]);
			expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 0, take: 20 })
			);
		});
	});

	describe('countAll', () => {
		it('should return total account count', async () => {
			mockPrismaService.account.count.mockResolvedValue(5);

			const result = await repository.countAll();

			expect(result).toBe(5);
		});
	});

	describe('findAllByUser', () => {
		it('should return accounts and count for a user', async () => {
			mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);
			mockPrismaService.account.count.mockResolvedValue(1);

			const result = await repository.findAllByUser(1, 0, 20);

			expect(result).toEqual([[mockAccount], 1]);
			expect(mockPrismaService.account.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { userId: 1 } })
			);
		});
	});

	describe('findByNumber', () => {
		it('should return account with owner name', async () => {
			const mockResult = {
				accountNumber: 1234567890,
				user: { name: 'John Doe' },
			};
			mockPrismaService.account.findUnique.mockResolvedValue(mockResult);

			const result = await repository.findByNumber(1234567890);

			expect(result).toEqual(mockResult);
			expect(mockPrismaService.account.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { accountNumber: 1234567890 } })
			);
		});

		it('should return null when account number not found', async () => {
			mockPrismaService.account.findUnique.mockResolvedValue(null);

			const result = await repository.findByNumber(9999999999);

			expect(result).toBeNull();
		});
	});

	// ─── Update ───────────────────────────────────────────────────────────────

	describe('update', () => {
		it('should update and return updated account', async () => {
			const updated = { ...mockAccount, status: AccountStatus.FROZEN };
			mockPrismaService.account.update.mockResolvedValue(updated);

			const result = await repository.update(1, {
				status: AccountStatus.FROZEN,
			});

			expect(result).toEqual(updated);
			expect(mockPrismaService.account.update).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 1 } })
			);
		});
	});

	// ─── Delete ───────────────────────────────────────────────────────────────

	describe('delete', () => {
		it('should delete and return deleted account', async () => {
			mockPrismaService.account.delete.mockResolvedValue(mockAccount);

			const result = await repository.delete(1);

			expect(result).toEqual(mockAccount);
			expect(mockPrismaService.account.delete).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 1 } })
			);
		});
	});
});
