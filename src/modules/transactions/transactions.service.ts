import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
	constructor(
		private prisma: PrismaService,
		private accounts: AccountsService
	) {}

	async create(accountId: string, userId: string, dto: CreateTransactionDto) {
		const balanceDelta =
			dto.type === TransactionType.CREDIT
				? new Prisma.Decimal(dto.amount)
				: new Prisma.Decimal(dto.amount).negated();

		return this.prisma.$transaction(async (tx) => {
			const account = await tx.account.findUnique({ where: { id: accountId } });
			if (!account) throw new NotFoundException('Account not found');
			if (account.userId !== userId) throw new ForbiddenException();

			const transaction = await tx.transaction.create({
				data: {
					accountId,
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
				},
			});
			await tx.account.update({
				where: { id: accountId },
				data: { balance: { increment: balanceDelta } },
			});
			return transaction;
		});
	}

	async findAll(accountId: string, userId: string, page = 1, limit = 20) {
		await this.accounts.findById(accountId, userId);
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			this.prisma.transaction.findMany({
				where: { accountId },
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.transaction.count({ where: { accountId } }),
		]);
		return { data, total, page, limit };
	}

	async findOne(id: string, userId: string) {
		const transaction = await this.prisma.transaction.findUnique({
			where: { id },
			include: { account: { select: { userId: true } } },
		});
		if (!transaction) throw new NotFoundException('Transaction not found');
		if (transaction.account.userId !== userId) throw new ForbiddenException();
		// Return transaction without the account field
		const { account: _, ...result } = transaction;
		return result;
	}
}
