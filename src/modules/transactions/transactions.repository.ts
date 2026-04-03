import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import type { TransactionEntity } from 'src/types/index.type';

@Injectable()
export class TransactionsRepository {
	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateTransactionDto): Promise<TransactionEntity> {
		return this.prisma.$transaction(async (trx) => {
			const transaction = await trx.transaction.create({
				data: {
					amount: dto.amount,
					type: dto.type,
					description: dto.description,
					sourceAccountId: dto.sourceAccountId,
					destinationAccountId: dto.destinationAccountId,
				},
			});

			if (dto.sourceAccountId) {
				await trx.account.update({
					where: { id: dto.sourceAccountId },
					data: { balance: { decrement: dto.amount } },
				});
			}

			if (dto.destinationAccountId) {
				await trx.account.update({
					where: { id: dto.destinationAccountId },
					data: { balance: { increment: dto.amount } },
				});
			}

			return transaction;
		});
	}

	findAll(): Promise<TransactionEntity[]> {
		return this.prisma.transaction.findMany();
	}
	findOne(id: number): Promise<TransactionEntity | null> {
		return this.prisma.transaction.findUnique({ where: { id } });
	}
}
