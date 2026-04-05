import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import type { AccountEntity, UpdateAccountData } from 'src/types/index.type';

const selectedData = {
	id: true,
	accountNumber: true,
	status: true,
	balance: true,
	createdAt: true,
	updatedAt: true,
	userId: true,
} as const;

@Injectable()
export class AccountsRepository {
	constructor(private prisma: PrismaService) {}

	create(userId: number, dto: CreateAccountDto): Promise<AccountEntity> {
		return this.prisma.account.create({
			data: { ...dto, userId },
			select: selectedData,
		});
	}

	findAll(): Promise<AccountEntity[]> {
		return this.prisma.account.findMany();
	}

	findAllByUser(
		userId: number,
		skip: number,
		take: number
	): Promise<[AccountEntity[], number]> {
		return Promise.all([
			this.prisma.account.findMany({
				where: { userId },
				select: selectedData,
				skip,
				take,
			}),
			this.prisma.account.count({ where: { userId } }),
		]);
	}

	findById(id: number): Promise<AccountEntity | null> {
		return this.prisma.account.findUnique({
			where: { id },
			select: selectedData,
		});
	}

	findByNumber(accountNumber: number) {
		return this.prisma.account.findUnique({
			where: { accountNumber },
			select: {
				accountNumber: true,
				user: {
					select: { name: true },
				},
			},
		});
	}

	update(id: number, data: UpdateAccountData): Promise<AccountEntity> {
		return this.prisma.account.update({
			where: { id },
			data,
			select: selectedData,
		});
	}

	delete(id: number): Promise<AccountEntity> {
		return this.prisma.account.delete({ where: { id }, select: selectedData });
	}
}
