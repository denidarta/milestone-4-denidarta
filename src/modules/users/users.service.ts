import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import type {
	UpdateUserData,
	UserEntity,
	PaginatedResult,
} from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
	constructor(private usersRepository: UsersRepository) {}

	async createAdmin(dto: RegisterDto): Promise<Omit<UserEntity, 'password'>> {
		const existing = await this.usersRepository.findByEmail(dto.email);
		if (existing) throw new ConflictException('Email already in use');

		const hash = await bcrypt.hash(dto.password, 10);
		const user = await this.usersRepository.create({
			email: dto.email,
			password: hash,
			name: dto.name ?? '',
			role: UserRole.ADMIN,
		});

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password, ...result } = user;
		return result;
	}

	async findAll(page = 1, limit = 20): Promise<PaginatedResult<UserEntity>> {
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			this.usersRepository.findAll(skip, limit),
			this.usersRepository.count(),
		]);
		return { data, total, page, limit };
	}

	async findById(id: number): Promise<UserEntity> {
		const user = await this.usersRepository.findById(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return user;
	}

	async findByEmail(email: string): Promise<{ email: string }> {
		const user = await this.usersRepository.findByEmail(email);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return { email: user.email };
	}

	// UPDATE -----------
	async update(id: number, data: UpdateUserData): Promise<UserEntity> {
		await this.findById(id);
		return this.usersRepository.update(id, data);
	}

	async delete(id: number): Promise<UserEntity> {
		await this.findById(id);
		return this.usersRepository.delete(id);
	}
}
