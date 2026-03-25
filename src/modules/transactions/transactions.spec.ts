// src/transactions/transactions.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockAccount = {
	id: 'account-1',
	userId: 'user-1',
	balance: 1000,
};

const mockTransaction = {
	id: 'trx-1',
	accountId: 'account-1',
	amount: 200,
	type: 'CREDIT' as const,
	description: 'Test deposit',
	createdAt: new Date(),
};

const mockPrismaService = {
	$transaction: jest.fn(),
	transaction: {
		findMany: jest.fn(),
		count: jest.fn(),
		findUnique: jest.fn(),
	},
};

const mockAccountsService = {
	findById: jest.fn(),
};

describe('TransactionsService', () => {
	let service: TransactionsService;
	let prisma: typeof mockPrismaService;
	let accounts: typeof mockAccountsService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TransactionsService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: AccountsService, useValue: mockAccountsService },
			],
		}).compile();

		service = module.get<TransactionsService>(TransactionsService);
		prisma = module.get(PrismaService);
		accounts = module.get(AccountsService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── create ───────────────────────────────────────────────────────────────

	describe('create transaction', () => {
		const dto = {
			amount: 200,
			type: 'CREDIT' as const,
			description: 'Test deposit',
		};

		it('should create a CREDIT transaction and increment balance', async () => {
			prisma.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: {
							findUnique: jest.fn().mockResolvedValue(mockAccount),
							update: jest.fn().mockResolvedValue(undefined),
						},
						transaction: {
							create: jest.fn().mockResolvedValue(mockTransaction),
						},
					};
					return cb(tx);
				}
			);

			const result = await service.create('account-1', 'user-1', dto);

			expect(result).toEqual(mockTransaction);
		});

		it('should create a DEBIT transaction and decrement balance', async () => {
			const debitDto = { ...dto, type: 'DEBIT' as const };
			const debitTrx = { ...mockTransaction, type: 'DEBIT' as const };

			prisma.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: {
							findUnique: jest.fn().mockResolvedValue(mockAccount),
							update: jest.fn().mockResolvedValue(undefined),
						},
						transaction: {
							create: jest.fn().mockResolvedValue(debitTrx),
						},
					};
					return cb(tx);
				}
			);

			const result = await service.create('account-1', 'user-1', debitDto);

			expect(result).toEqual(debitTrx);
		});

		it('should throw NotFoundException when account does not exist', async () => {
			prisma.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: { findUnique: jest.fn().mockResolvedValue(null) },
					};
					return cb(tx);
				}
			);

			await expect(service.create('account-1', 'user-1', dto)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when account belongs to another user', async () => {
			const otherUserAccount = { ...mockAccount, userId: 'other-user' };

			prisma.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: {
							findUnique: jest.fn().mockResolvedValue(otherUserAccount),
						},
					};
					return cb(tx);
				}
			);

			await expect(service.create('account-1', 'user-1', dto)).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	// ─── findAll ──────────────────────────────────────────────────────────────

	describe('find all transactions', () => {
		it('should return paginated transactions', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			prisma.transaction.findMany.mockResolvedValue([mockTransaction]);
			prisma.transaction.count.mockResolvedValue(1);

			const result = await service.findAll('account-1', 'user-1', 1, 20);

			expect(result).toEqual({
				data: [mockTransaction],
				total: 1,
				page: 1,
				limit: 20,
			});
			expect(accounts.findById).toHaveBeenCalledWith('account-1', 'user-1');
		});

		it('should apply correct skip offset for page 2', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			prisma.transaction.findMany.mockResolvedValue([]);
			prisma.transaction.count.mockResolvedValue(0);

			await service.findAll('account-1', 'user-1', 2, 10);

			expect(prisma.transaction.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 10, take: 10 })
			);
		});

		it('should throw if account not found or not owned by user', async () => {
			accounts.findById.mockRejectedValue(new NotFoundException());

			await expect(service.findAll('account-1', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	// ─── findOne ──────────────────────────────────────────────────────────────

	describe('find one transaction', () => {
		it('should return transaction without account field', async () => {
			prisma.transaction.findUnique.mockResolvedValue({
				...mockTransaction,
				account: { userId: 'user-1' },
			});

			const result = await service.findOne('trx-1', 'user-1');

			expect(result).toEqual(mockTransaction);
			expect(result).not.toHaveProperty('account');
		});

		it('should throw NotFoundException when transaction does not exist', async () => {
			prisma.transaction.findUnique.mockResolvedValue(null);

			await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when transaction belongs to another user', async () => {
			prisma.transaction.findUnique.mockResolvedValue({
				...mockTransaction,
				account: { userId: 'other-user' },
			});

			await expect(service.findOne('trx-1', 'user-1')).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
