import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { PaginatedResult, TransactionEntity } from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';

@Injectable()
export class TransactionsService {
	constructor(
		private prisma: PrismaService,
		private accounts: AccountsService
	) {}

	async create(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		if (dto.type === TransactionType.DEPOSIT) {
			return this.createDeposit(accountId, userId, dto);
		} else if (dto.type === TransactionType.WITHDRAWAL) {
			return this.createWithdrawal(accountId, userId, dto);
		} else {
			return this.createTransfer(accountId, userId, dto);
		}
	}

	private async findOwnedAccount(
		tx: Prisma.TransactionClient,
		accountId: number,
		userId: number,
		label = 'Account'
	) {
		const account = await tx.account.findUnique({ where: { id: accountId } });
		if (!account) throw new NotFoundException(`${label} not found`);
		if (account.userId !== userId) throw new ForbiddenException();
		return account;
	}

	private async createDeposit(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
			await this.findOwnedAccount(tx, accountId, userId);

			const transaction = await tx.transaction.create({
				data: {
					destinationAccountId: accountId,
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
				},
			});
			await tx.account.update({
				where: { id: accountId },
				data: { balance: { increment: new Prisma.Decimal(dto.amount) } },
			});
			return transaction;
		});
	}

	private async createWithdrawal(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
			const account = await this.findOwnedAccount(tx, accountId, userId);

			if (new Prisma.Decimal(account.balance).lt(new Prisma.Decimal(dto.amount))) {
				throw new BadRequestException('Insufficient balance');
			}

			const transaction = await tx.transaction.create({
				data: {
					sourceAccountId: accountId,
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
				},
			});
			await tx.account.update({
				where: { id: accountId },
				data: { balance: { decrement: new Prisma.Decimal(dto.amount) } },
			});
			return transaction;
		});
	}

	private async createTransfer(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
			const sourceAccount = await this.findOwnedAccount(tx, accountId, userId, 'Source account');

			if (new Prisma.Decimal(sourceAccount.balance).lt(new Prisma.Decimal(dto.amount))) {
				throw new BadRequestException('Insufficient balance');
			}

			const destinationAccount = await tx.account.findUnique({
				where: { id: dto.destinationAccountId },
			});
			if (!destinationAccount)
				throw new NotFoundException('Destination account not found');

			const transaction = await tx.transaction.create({
				data: {
					sourceAccountId: accountId,
					destinationAccountId: dto.destinationAccountId,
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
				},
			});
			await tx.account.update({
				where: { id: accountId },
				data: { balance: { decrement: new Prisma.Decimal(dto.amount) } },
			});
			await tx.account.update({
				where: { id: dto.destinationAccountId },
				data: { balance: { increment: new Prisma.Decimal(dto.amount) } },
			});
			return transaction;
		});
	}

	async findAll(
		accountId: number,
		userId: number,
		page = 1,
		limit = 20,
		role?: UserRole
	): Promise<PaginatedResult<TransactionEntity>> {
		await this.accounts.findById(accountId, userId, role);
		const skip = (page - 1) * limit;
		const accountFilter = {
			OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }],
		};
		const [data, total] = await Promise.all([
			this.prisma.transaction.findMany({
				where: accountFilter,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.transaction.count({ where: accountFilter }),
		]);
		return { data, total, page, limit };
	}

	async findOne(id: number, userId: number, role?: UserRole): Promise<TransactionEntity> {
		const transaction = await this.prisma.transaction.findUnique({
			where: { id },
			include: {
				sourceAccount: { select: { userId: true } },
				destinationAccount: { select: { userId: true } },
			},
		});
		if (!transaction) throw new NotFoundException('Transaction not found');

		if (role !== UserRole.ADMIN) {
			const isOwner =
				transaction.sourceAccount?.userId === userId ||
				transaction.destinationAccount?.userId === userId;
			if (!isOwner) throw new ForbiddenException();
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { sourceAccount, destinationAccount, ...result } = transaction;
		return result;
	}
}
