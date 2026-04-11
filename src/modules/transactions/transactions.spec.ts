import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsRepository } from './transactions.repository';
import { AccountsService } from '../accounts/accounts.service';
import { Decimal } from '@prisma/client/runtime/client';

const mockAccount = {
	id: 1,
	userId: 1,
	balance: new Decimal(1000),
};

const mockTransaction = {
	id: 1,
	amount: new Decimal(200),
	type: 'DEPOSIT' as const,
	description: 'Test deposit',
	createdAt: new Date(),
};

const mockAccountsService = {
	findById: jest.fn(),
};

const mockTransactionsRepository = {
	createDeposit: jest.fn(),
	createWithdrawal: jest.fn(),
	createTransfer: jest.fn(),
	findAllByAccount: jest.fn(),
	countByAccount: jest.fn(),
	findOneWithAccounts: jest.fn(),
};

describe('TransactionsService', () => {
	let service: TransactionsService;
	let accounts: typeof mockAccountsService;
	let repository: typeof mockTransactionsRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TransactionsService,
				{ provide: TransactionsRepository, useValue: mockTransactionsRepository },
				{ provide: AccountsService, useValue: mockAccountsService },
			],
		}).compile();

		service = module.get<TransactionsService>(TransactionsService);
		accounts = module.get(AccountsService);
		repository = module.get(TransactionsRepository);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── create ───────────────────────────────────────────────────────────────

	describe('create transaction', () => {
		const dto = {
			amount: new Decimal(200),
			type: 'DEPOSIT' as const,
			description: 'Test deposit',
		};

		it('should create a DEPOSIT transaction', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			repository.createDeposit.mockResolvedValue(mockTransaction);

			const result = await service.create(1, 1, dto);

			expect(result).toEqual(mockTransaction);
			expect(repository.createDeposit).toHaveBeenCalledWith(1, dto);
		});

		it('should create a WITHDRAWAL transaction', async () => {
			const withdrawalDto = { ...dto, type: 'WITHDRAWAL' as const };
			const withdrawalTrx = { ...mockTransaction, type: 'WITHDRAWAL' as const };

			accounts.findById.mockResolvedValue(mockAccount);
			repository.createWithdrawal.mockResolvedValue(withdrawalTrx);

			const result = await service.create(1, 1, withdrawalDto);

			expect(result).toEqual(withdrawalTrx);
			expect(repository.createWithdrawal).toHaveBeenCalledWith(1, withdrawalDto);
		});

		it('should throw BadRequestException when balance is insufficient for withdrawal', async () => {
			const lowBalanceAccount = { ...mockAccount, balance: new Decimal(10) };
			accounts.findById.mockResolvedValue(lowBalanceAccount);

			await expect(
				service.create(1, 1, { ...dto, type: 'WITHDRAWAL' as const })
			).rejects.toThrow(BadRequestException);
		});

		it('should throw NotFoundException when account does not exist', async () => {
			accounts.findById.mockRejectedValue(new NotFoundException());

			await expect(service.create(1, 1, dto)).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when account belongs to another user', async () => {
			accounts.findById.mockResolvedValue({ ...mockAccount, userId: 2 });

			await expect(service.create(1, 1, dto)).rejects.toThrow(ForbiddenException);
		});
	});

	// ─── findAll ──────────────────────────────────────────────────────────────

	describe('find all transactions', () => {
		it('should return paginated transactions', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			repository.findAllByAccount.mockResolvedValue([mockTransaction]);
			repository.countByAccount.mockResolvedValue(1);

			const result = await service.findAll(1, 1, 1, 20);

			expect(result).toEqual({
				data: [mockTransaction],
				total: 1,
				page: 1,
				limit: 20,
			});
			expect(accounts.findById).toHaveBeenCalledWith(1, 1, undefined);
		});

		it('should apply correct skip offset for page 2', async () => {
			accounts.findById.mockResolvedValue(mockAccount);
			repository.findAllByAccount.mockResolvedValue([]);
			repository.countByAccount.mockResolvedValue(0);

			await service.findAll(1, 1, 2, 10);

			expect(repository.findAllByAccount).toHaveBeenCalledWith(
				expect.any(Object),
				10,
				10
			);
		});

		it('should throw if account not found or not owned by user', async () => {
			accounts.findById.mockRejectedValue(new NotFoundException());

			await expect(service.findAll(1, 1)).rejects.toThrow(NotFoundException);
		});
	});

	// ─── findOne ──────────────────────────────────────────────────────────────

	describe('find one transaction', () => {
		it('should throw NotFoundException when transaction does not exist', async () => {
			repository.findOneWithAccounts.mockResolvedValue(null);

			await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException when transaction belongs to another user', async () => {
			repository.findOneWithAccounts.mockResolvedValue({
				...mockTransaction,
				sourceAccount: { userId: 2 },
				destinationAccount: { userId: 2 },
			});

			await expect(service.findOne(1, 1)).rejects.toThrow(ForbiddenException);
		});
	});
});
