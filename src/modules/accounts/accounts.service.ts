import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
	constructor(private prisma: PrismaService) {}

	async create(userId: string, dto: CreateAccountDto) {
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

	async findAll(userId: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			this.prisma.account.findMany({ where: { userId }, skip, take: limit }),
			this.prisma.account.count({ where: { userId } }),
		]);
		return { data, total, page, limit };
	}

	async findById(id: string, userId: string) {
		const account = await this.prisma.account.findUnique({ where: { id } });
		if (!account) throw new NotFoundException('Account not found');
		if (account.userId !== userId)
			throw new ForbiddenException('Access denied');
		return account;
	}

	async findByAccountNumber(accountNumber: number) {
		return this.prisma.account.findUnique({
			where: { accountNumber },
		});
	}

	async update(id: string, userId: string) {
		await this.findById(id, userId);
	}

	async remove(id: string, userId: string) {
		await this.findById(id, userId);
		return this.prisma.account.delete({ where: { id } });
	}
}
