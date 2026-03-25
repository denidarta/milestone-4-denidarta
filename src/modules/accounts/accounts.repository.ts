import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const selectedData = {
	id: true,
	accountNumber: true,
	balance: true,
	createdAt: true,
	updatedAt: true,
	userId: true,
} as const;

@Injectable()
export class AccountsRepository {
	constructor(private prisma: PrismaService) {}

	create(userId: string, dto: CreateAccountDto) {
		return this.prisma.account.create({ data: { ...dto, userId } });
	}

	findAllByUser(userId: string, skip: number, take: number) {
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

	findById(id: string) {
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

	update(id: string, data: UpdateAccountDto) {
		return this.prisma.account.update({ where: { id }, data });
	}

	delete(id: string) {
		return this.prisma.account.delete({ where: { id } });
	}
}
