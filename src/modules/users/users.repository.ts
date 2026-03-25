import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
	id: true,
	name: true,
	email: true,
	createdAt: true,
	updatedAt: true,
} as const;

@Injectable()
export class UsersRepository {
	constructor(private prisma: PrismaService) {}

	create(data: {
		email: string;
		password: string;
		name: string;
		role: import('@prisma/client').UserRole;
	}) {
		return this.prisma.user.create({ data });
	}

	findAll() {
		return this.prisma.user.findMany({ select: userSelect });
	}

	findById(id: string) {
		return this.prisma.user.findUnique({ where: { id }, select: userSelect });
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
			select: userSelect,
		});
	}

	findByEmailWithPassword(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
			select: {
				...userSelect,
				password: true,
				role: true,
			},
		});
	}

	update(id: string, data: UpdateUserDto) {
		return this.prisma.user.update({ where: { id }, data });
	}

	delete(id: string) {
		return this.prisma.user.delete({ where: { id } });
	}
}
