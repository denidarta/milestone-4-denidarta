import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import type {
	AccountEntity,
	PaginatedResult,
	UpdateAccountData,
} from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';

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

	async findAll(page = 1, limit = 20): Promise<PaginatedResult<AccountEntity>> {
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			this.accountsRepository.findAll(skip, limit),
			this.accountsRepository.countAll(),
		]);
		return { data, total, page, limit };
	}

	async findAllByUser(
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

	async findById(
		id: number,
		userId: number,
		role?: UserRole
	): Promise<AccountEntity> {
		const account = await this.prisma.account.findUnique({ where: { id } });
		if (!account) throw new NotFoundException('Account not found');
		if (role !== UserRole.ADMIN && account.userId !== userId)
			throw new ForbiddenException('Access denied');
		return account;
	}

	async findByAccountNumber(accountNumber: number) {
		const account = await this.accountsRepository.findByNumber(accountNumber);
		if (!account) throw new NotFoundException('Account not found');
		return account;
	}

	async update(
		id: number,
		userId: number,
		role: UserRole,
		data: UpdateAccountData
	): Promise<AccountEntity> {
		if (role !== UserRole.ADMIN) {
			await this.findById(id, userId);
		} else {
			const account = await this.prisma.account.findUnique({ where: { id } });
			if (!account) throw new NotFoundException('Account not found');
		}
		return this.accountsRepository.update(id, data);
	}

	async remove(id: number, userId: number, role: UserRole): Promise<AccountEntity> {
		await this.findById(id, userId, role);
		return this.accountsRepository.delete(id);
	}
}
