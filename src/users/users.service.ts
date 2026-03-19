import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private usersRepository: UsersRepository) {}

	async findById(id: string) {
		const user = await this.usersRepository.findById(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}
		return user;
	}

	async update(id: string, data: UpdateUserDto) {
		await this.findById(id);
		return this.usersRepository.update(id, data);
	}

	async delete(id: string) {
		await this.findById(id);
		return this.usersRepository.delete(id);
	}
}
