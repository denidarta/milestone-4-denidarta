import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Decimal } from '@prisma/client/runtime/client';
import { UserRole } from 'src/types/index.type';

const mockTransaction = {
	id: 1,
	amount: new Decimal(200),
	type: 'DEPOSIT' as const,
	description: 'Test deposit',
	sourceAccountId: null,
	destinationAccountId: 1,
	createdAt: new Date(),
};

const mockTransactionsService = {
	create: jest.fn(),
	findAll: jest.fn(),
	findOne: jest.fn(),
};

const regularUser = { userId: 1, role: UserRole.USER };
const adminUser = { userId: 1, role: UserRole.ADMIN };

describe('TransactionsController', () => {
	let controller: TransactionsController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TransactionsController],
			providers: [
				{ provide: TransactionsService, useValue: mockTransactionsService },
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<TransactionsController>(TransactionsController);
	});

	afterEach(() => jest.clearAllMocks());

	// ─── Create ───────────────────────────────────────────────────────────────

	describe('create', () => {
		const dto = {
			amount: new Decimal(200),
			type: 'DEPOSIT' as const,
			description: 'Test deposit',
		};

		it('should create and return a transaction', async () => {
			mockTransactionsService.create.mockResolvedValue(mockTransaction);

			const result = await controller.create(1, regularUser, dto);

			expect(result).toEqual(mockTransaction);
			expect(mockTransactionsService.create).toHaveBeenCalledWith(1, 1, dto);
		});

		it('should throw NotFoundException when account not found', async () => {
			mockTransactionsService.create.mockRejectedValue(new NotFoundException());

			await expect(controller.create(99, regularUser, dto)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when account belongs to another user', async () => {
			mockTransactionsService.create.mockRejectedValue(
				new ForbiddenException()
			);

			await expect(controller.create(1, regularUser, dto)).rejects.toThrow(
				ForbiddenException
			);
		});
	});

	// ─── Read ─────────────────────────────────────────────────────────────────

	describe('findAll', () => {
		it('should return paginated transactions for an account', async () => {
			const mockList = {
				data: [mockTransaction],
				total: 1,
				page: 1,
				limit: 20,
			};
			mockTransactionsService.findAll.mockResolvedValue(mockList);

			const result = await controller.findAll(1, regularUser, {
				page: 1,
				limit: 20,
			});

			expect(result).toEqual(mockList);
			expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
				1,
				1,
				1,
				20,
				UserRole.USER
			);
		});

		it('should apply page and limit query params', async () => {
			mockTransactionsService.findAll.mockResolvedValue({
				data: [],
				total: 0,
				page: 2,
				limit: 10,
			});

			await controller.findAll(1, regularUser, { page: 2, limit: 10 });

			expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
				1,
				1,
				2,
				10,
				UserRole.USER
			);
		});

		it('should pass admin role to service', async () => {
			mockTransactionsService.findAll.mockResolvedValue({
				data: [],
				total: 0,
				page: 1,
				limit: 20,
			});

			await controller.findAll(1, adminUser, { page: 1, limit: 20 });

			expect(mockTransactionsService.findAll).toHaveBeenCalledWith(
				1,
				1,
				1,
				20,
				UserRole.ADMIN
			);
		});
	});

	describe('findOne', () => {
		it('should return transaction by id', async () => {
			mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

			const result = await controller.findOne(1, regularUser);

			expect(result).toEqual(mockTransaction);
			expect(mockTransactionsService.findOne).toHaveBeenCalledWith(
				1,
				1,
				UserRole.USER
			);
		});

		it('should throw NotFoundException when transaction not found', async () => {
			mockTransactionsService.findOne.mockRejectedValue(
				new NotFoundException()
			);

			await expect(controller.findOne(99, regularUser)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw ForbiddenException when transaction belongs to another user', async () => {
			mockTransactionsService.findOne.mockRejectedValue(
				new ForbiddenException()
			);

			await expect(controller.findOne(1, regularUser)).rejects.toThrow(
				ForbiddenException
			);
		});
	});
});
