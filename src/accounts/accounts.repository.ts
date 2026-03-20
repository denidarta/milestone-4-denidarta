import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const selectedData = {
	id: true,
	accountNumber: true,
	balance: true,
	createdAt: true,
	updatedAt: true,
} as const;

@Injectable()
export class AccountsRepository {
	constructor(private prisma: PrismaService) {}

	findAll() {
		return this.prisma.account.findMany({
			select: selectedData,
		});
	}

	finById(id: string) {
		return this.prisma.account.findUnique({
			where: { id },
			select: selectedData,
		});
	}
	findByNumber() {}
	create() {}
	// Only update account status is allowed.
	update() {}
	delete(id: string) {
		return this.prisma.account.delete({ where: { id } });
	}
}
