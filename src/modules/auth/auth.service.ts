import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class AuthService {
	constructor(
		private usersRepository: UsersRepository,
		private jwt: JwtService
	) {}

	async register(dto: RegisterDto) {
		const existing = await this.usersRepository.findByEmail(dto.email);
		if (existing) throw new ConflictException('Email already in use');

		const hash = await bcrypt.hash(dto.password, 10);
		const user = await this.usersRepository.create({
			email: dto.email,
			password: hash,
			name: dto.name ?? '',
			role: UserRole.USER,
		});

		return this.signToken(user.id, user.email);
	}

	async login(dto: LoginDto) {
		const user = await this.usersRepository.findByEmailWithPassword(dto.email);
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const valid = await bcrypt.compare(dto.password, user.password);
		if (!valid) throw new UnauthorizedException('Invalid credentials');

		return this.signToken(user.id, user.email);
	}

	private async signToken(
		userId: string,
		email: string
	): Promise<{ access_token: string }> {
		const access_token = await this.jwt.signAsync({ sub: userId, email });
		return { access_token };
	}
}
