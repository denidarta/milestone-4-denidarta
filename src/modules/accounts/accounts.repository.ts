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

const selectedDataSafe = {
	name: true,
};

@Injectable()
export class AccountsRepository {
	constructor(private prisma: PrismaService) {}

	create(userId: number, dto: CreateAccountDto): Promise<AccountEntity> {
		return this.prisma.account.create({
			data: { ...dto, userId },
			select: selectedData,
		});
	}

	findAll(skip: number, take: number): Promise<AccountEntity[]> {
		return this.prisma.account.findMany({ select: selectedData, skip, take });
	}

	countAll(): Promise<number> {
		return this.prisma.account.count();
	}
	// get all acount info owned by user
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
	//get account info by account id
	findById(id: number): Promise<AccountEntity | null> {
		return this.prisma.account.findUnique({
			where: { id },
			select: selectedData,
		});
	}

	// get account info by account number
	findByNumber(accountNumber: number) {
		return this.prisma.account.findUnique({
			where: { accountNumber },
			select: {
				accountNumber: true,
				user: {
					select: selectedDataSafe,
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
