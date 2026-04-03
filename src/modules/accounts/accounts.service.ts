import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import type { AccountEntity, PaginatedResult } from 'src/types/index.type';

@Injectable()
export class AccountsService {
	constructor(
		private prisma: PrismaService,
		private accountsRepository: AccountsRepository
	) {}

	async create(userId: number, dto: CreateAccountDto): Promise<AccountEntity> {
		let accountNumber: number;
		let exist = true;
		while (exist) {
			accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
			exist = !!(await this.prisma.account.findUnique({
				where: { accountNumber },
			}));
		}
		return this.prisma.account.create({
			data: { ...dto, userId },
		});
	}

	async findAll(
		userId: number,
		page = 1,
		limit = 20
	): Promise<PaginatedResult<AccountEntity>> {
		const skip = (page - 1) * limit;
		const [data, total] = await this.accountsRepository.findAllByUser(
			userId,
			skip,
			limit
		);
		return { data, total, page, limit };
	}

	async findById(id: number, userId: number): Promise<AccountEntity> {
		const account = await this.prisma.account.findUnique({ where: { id } });
		if (!account) throw new NotFoundException('Account not found');
		if (account.userId !== userId)
			throw new ForbiddenException('Access denied');
		return account;
	}

	async findByAccountNumber(
		accountNumber: number
	): Promise<AccountEntity | null> {
		return this.prisma.account.findUnique({
			where: { accountNumber },
		});
	}

	async update(id: number, userId: number): Promise<void> {
		await this.findById(id, userId);
	}

	async remove(id: number, userId: number): Promise<AccountEntity> {
		await this.findById(id, userId);
		return this.prisma.account.delete({ where: { id } });
	}
}
