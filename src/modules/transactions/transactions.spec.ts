// src/transactions/transactions.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AccountsService } from '../accounts/accounts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/__mocks__/prisma.service';
import { Decimal } from '@prisma/client/runtime/client';

const mockAccount = {
	id: 1,
	userId: 1,
	balance: 1000,
};

const mockTransaction = {
	id: 1,
	accountId: 1,
	amount: 200,
	type: 'DEPOSIT' as const,
	description: 'Test deposit',
	createdAt: new Date(),
};

const mockAccountsService = {
	findById: jest.fn(),
};

describe('TransactionsService', () => {
	let service: TransactionsService;
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
		accounts = module.get(AccountsService);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── create ───────────────────────────────────────────────────────────────

	describe('create transaction', () => {
		const dto = {
			amount: new Decimal(200),
			type: 'DEPOSIT' as const,
			description: 'Test deposit',
		};

		it('should create a Top Up transaction and increment balance', async () => {
			mockPrismaService.$transaction.mockImplementation(
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

			const result = await service.create(1, 1, dto);

			expect(result).toEqual(mockTransaction);
		});

		it('should create a DEBIT transaction and decrement balance', async () => {
			const debitDto = { ...dto, type: 'WITHDRAWAL' as const };
			const debitTrx = { ...mockTransaction, type: 'WITHDRAWAL' as const };

			mockPrismaService.$transaction.mockImplementation(
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

			const result = await service.create(1, 1, debitDto);

			expect(result).toEqual(debitTrx);
		});

		it('should throw NotFoundException when account does not exist', async () => {
			mockPrismaService.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: { findUnique: jest.fn().mockResolvedValue(null) },
					};
					return cb(tx);
				}
			);

			await expect(service.create(1, 1, dto)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when account belongs to another user', async () => {
			const otherUserAccount = { ...mockAccount, userId: 2 };

			mockPrismaService.$transaction.mockImplementation(
				(cb: (tx: object) => Promise<unknown>) => {
					const tx = {
						account: {
							findUnique: jest.fn().mockResolvedValue(otherUserAccount),
						},
					};
					return cb(tx);
				}
			);

			await expect(service.create(1, 1, dto)).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	// ─── findAll ──────────────────────────────────────────────────────────────

	describe('find all transactions', () => {
		it('should return paginated transactions', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			mockPrismaService.transaction.findMany.mockResolvedValue([
				mockTransaction,
			]);
			mockPrismaService.transaction.count.mockResolvedValue(1);

			const result = await service.findAll(1, 1, 1, 20);

			expect(result).toEqual({
				data: [mockTransaction],
				total: 1,
				page: 1,
				limit: 20,
			});
			expect(accounts.findById).toHaveBeenCalledWith(1, 1);
		});

		it('should apply correct skip offset for page 2', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			mockPrismaService.transaction.findMany.mockResolvedValue([]);
			mockPrismaService.transaction.count.mockResolvedValue(0);

			await service.findAll(1, 1, 2, 10);

			expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 10, take: 10 })
			);
		});

		it('should throw if account not found or not owned by user', async () => {
			accounts.findById.mockRejectedValue(new NotFoundException());

			await expect(service.findAll(1, 1)).rejects.toThrow(NotFoundException);
		});
	});

	describe('find one transaction', () => {
		it('should throw NotFoundException when transaction does not exist', async () => {
			mockPrismaService.transaction.findUnique.mockResolvedValue(null);

			await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when transaction belongs to another user', async () => {
			mockPrismaService.transaction.findUnique.mockResolvedValue({
				...mockTransaction,
				sourceAccount: { userId: 2 },
				destinationAccount: { userId: 2 },
			});

			await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
		});
	});
});
