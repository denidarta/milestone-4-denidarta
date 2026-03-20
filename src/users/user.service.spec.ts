// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockUser = {
	id: 'user-1',
	name: 'John Doe',
	email: 'john@example.com',
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockUsersRepository = {
	findById: jest.fn(),
	update: jest.fn(),
	delete: jest.fn(),
};

describe('UsersService', () => {
	let service: UsersService;
	let repository: typeof mockUsersRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: UsersRepository, useValue: mockUsersRepository },
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		repository = module.get(UsersRepository);
	});

	afterEach(() => jest.clearAllMocks());

	describe('find user by user_id', () => {
		it('should return user when found', async () => {
			repository.findById.mockResolvedValue(mockUser);

			const result = await service.findById('user-1');

			expect(result).toEqual(mockUser);
			expect(repository.findById).toHaveBeenCalledWith('user-1');
		});

		it('should throw NotFoundException when user not found', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.findById('nonexistent')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('update user data', () => {
		it('should update and return updated user', async () => {
			const updateDto = { name: 'Jane Doe' };
			const updatedUser = { ...mockUser, ...updateDto };

			repository.findById.mockResolvedValue(mockUser);
			repository.update.mockResolvedValue(updatedUser);

			const result = await service.update('user-1', updateDto);

			expect(result).toEqual(updatedUser);
			expect(repository.update).toHaveBeenCalledWith('user-1', updateDto);
		});

		it('should throw NotFoundException if user does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(
				service.update('nonexistent', { name: 'X' })
			).rejects.toThrow(NotFoundException);
			expect(repository.update).not.toHaveBeenCalled();
		});
	});

	describe('delete user from user list', () => {
		it('should delete user when found', async () => {
			repository.findById.mockResolvedValue(mockUser);
			repository.delete.mockResolvedValue(mockUser);

			const result = await service.delete('user-1');

			expect(result).toEqual(mockUser);
			expect(repository.delete).toHaveBeenCalledWith('user-1');
		});

		it('should throw NotFoundException if user does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.delete('nonexistent')).rejects.toThrow(
				NotFoundException
			);
			expect(repository.delete).not.toHaveBeenCalled();
		});
	});
});
