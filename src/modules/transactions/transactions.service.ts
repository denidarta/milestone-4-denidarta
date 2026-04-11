import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';
import { TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { PaginatedResult, TransactionEntity } from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';

@Injectable()
export class TransactionsService {
	constructor(
		private repository: TransactionsRepository,
		private accounts: AccountsService
	) {}

	async create(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		switch (dto.type) {
			case TransactionType.DEPOSIT:
				return this.createDeposit(accountId, userId, dto);
			case TransactionType.WITHDRAWAL:
				return this.createWithdrawal(accountId, userId, dto);
			default:
				return this.createTransfer(accountId, userId, dto);
		}
	}

	private async createDeposit(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		const account = await this.accounts.findById(accountId, userId);
		if (account.userId !== userId) throw new ForbiddenException();

		return this.repository.createDeposit(accountId, dto);
	}

	private async createWithdrawal(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		const account = await this.accounts.findById(accountId, userId);
		if (account.userId !== userId) throw new ForbiddenException();

		if (
			new Prisma.Decimal(account.balance).lt(new Prisma.Decimal(dto.amount))
		) {
			throw new BadRequestException('Insufficient balance');
		}

		return this.repository.createWithdrawal(accountId, dto);
	}

	private async createTransfer(
		accountId: number,
		userId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		const sourceAccount = await this.accounts.findById(accountId, userId);
		if (sourceAccount.userId !== userId) throw new ForbiddenException();

		if (
			new Prisma.Decimal(sourceAccount.balance).lt(
				new Prisma.Decimal(dto.amount)
			)
		) {
			throw new BadRequestException('Insufficient balance');
		}

		const destinationAccount = await this.accounts.findById(
			dto.destinationAccountId!,
			userId
		);
		if (!destinationAccount)
			throw new NotFoundException('Destination account not found');

		return this.repository.createTransfer(
			accountId,
			dto.destinationAccountId!,
			dto
		);
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
		const filter = {
			OR: [
				{ sourceAccountId: accountId },
				{ destinationAccountId: accountId },
			] as [{ sourceAccountId: number }, { destinationAccountId: number }],
		};

		const [data, total] = await Promise.all([
			this.repository.findAllByAccount(filter, skip, limit),
			this.repository.countByAccount(filter),
		]);

		return { data, total, page, limit };
	}

	async findOne(
		id: number,
		userId: number,
		role?: UserRole
	): Promise<TransactionEntity> {
		const transaction = await this.repository.findOneWithAccounts(id);
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
