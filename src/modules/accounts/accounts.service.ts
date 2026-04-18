import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import type {
	AccountEntity,
	PaginatedResult,
	UpdateAccountData,
} from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';

@Injectable()
export class AccountsService {
	constructor(private accountsRepository: AccountsRepository) {}

	async create(userId: number): Promise<AccountEntity> {
		let accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
		while (await this.accountsRepository.findByNumber(accountNumber)) {
			accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);
		}
		return this.accountsRepository.create(accountNumber, userId);
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
		const account = await this.accountsRepository.findById(id);
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
		await this.findById(id, userId, role);
		return this.accountsRepository.update(id, data);
	}

	async remove(
		id: number,
		userId: number,
		role: UserRole
	): Promise<AccountEntity> {
		await this.findById(id, userId, role);
		return this.accountsRepository.delete(id);
	}
}
