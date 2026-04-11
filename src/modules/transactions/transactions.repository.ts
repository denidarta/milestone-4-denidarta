import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { TransactionEntity } from 'src/types/index.type';

type AccountFilter = {
	OR: [{ sourceAccountId: number }, { destinationAccountId: number }];
};

@Injectable()
export class TransactionsRepository {
	constructor(private readonly prisma: PrismaService) {}

	createDeposit(
		accountId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
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

	createWithdrawal(
		accountId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
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

	createTransfer(
		sourceAccountId: number,
		destinationAccountId: number,
		dto: CreateTransactionDto
	): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (tx) => {
			const transaction = await tx.transaction.create({
				data: {
					sourceAccountId,
					destinationAccountId,
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
				},
			});
			await tx.account.update({
				where: { id: sourceAccountId },
				data: { balance: { decrement: new Prisma.Decimal(dto.amount) } },
			});
			await tx.account.update({
				where: { id: destinationAccountId },
				data: { balance: { increment: new Prisma.Decimal(dto.amount) } },
			});
			return transaction;
		});
	}

	findAllByAccount(
		filter: AccountFilter,
		skip: number,
		take: number
	): Promise<TransactionEntity[]> {
		return this.prisma.transaction.findMany({
			where: filter,
			skip,
			take,
			orderBy: { createdAt: 'desc' },
		});
	}

	countByAccount(filter: AccountFilter): Promise<number> {
		return this.prisma.transaction.count({ where: filter });
	}

	findOneWithAccounts(id: number) {
		return this.prisma.transaction.findUnique({
			where: { id },
			include: {
				sourceAccount: { select: { userId: true } },
				destinationAccount: { select: { userId: true } },
			},
		});
	}
}
