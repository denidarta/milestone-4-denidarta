import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
	UpdateUserData,
	UserEntity,
	UserWithCredentials,
} from 'src/types/index.type';
import { UserRole } from '@prisma/client';

export const userSelect = {
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
		role: UserRole;
	}) {
		return this.prisma.user.create({ data });
	}

	findAll(skip: number, take: number): Promise<UserEntity[]> {
		return this.prisma.user.findMany({ select: userSelect, skip, take });
	}

	count(): Promise<number> {
		return this.prisma.user.count();
	}

	findById(id: number): Promise<UserEntity | null> {
		return this.prisma.user.findUnique({
			where: { id },
			select: userSelect,
		});
	}

	findByEmail(email: string): Promise<UserEntity | null> {
		return this.prisma.user.findUnique({
			where: { email },
			select: userSelect,
		});
	}

	findByEmailWithPassword(email: string): Promise<UserWithCredentials | null> {
		return this.prisma.user.findUnique({
			where: { email },
			select: {
				...userSelect,
				password: true,
				role: true,
			},
		});
	}

	update(id: number, data: UpdateUserData): Promise<UserEntity> {
		return this.prisma.user.update({ where: { id }, data, select: userSelect });
	}

	async delete(id: number): Promise<UserEntity> {
		await this.prisma.account.deleteMany({ where: { userId: id } });
		return this.prisma.user.delete({ where: { id }, select: userSelect });
	}
}
