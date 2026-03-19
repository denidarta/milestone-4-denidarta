import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
	constructor(private prisma: PrismaService) {}

	findAll() {
		return this.prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}

	create(data: {
		email: string;
		password: string;
		name: string;
		role: import('@prisma/client').UserRole;
	}) {
		return this.prisma.user.create({ data });
	}

	update(id: string, data: UpdateUserDto) {
		return this.prisma.user.update({ where: { id }, data });
	}

	delete(id: string) {
		return this.prisma.user.delete({ where: { id } });
	}
}
