import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockUser = {
	id: 1,
	name: 'John Doe',
	email: 'john@example.com',
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockUsersRepository = {
	findById: jest.fn(),
	findByEmail: jest.fn(),
	findByAccountNumber: jest.fn(),
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

			const result = await service.findById(1);

			expect(result).toEqual(mockUser);
			expect(repository.findById).toHaveBeenCalledWith(1);
		});

		it('should throw NotFoundException when user not found', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.findById(99)).rejects.toThrow(NotFoundException);
		});
	});

	describe('find user by their email', () => {
		it('should return user when found', async () => {
			repository.findByEmail.mockResolvedValue(mockUser);

			const result = await service.findByEmail('john@example.com');

			expect(result).toEqual({ email: mockUser.email });
			expect(repository.findByEmail).toHaveBeenCalledWith('john@example.com');
		});

		it('should throw NotFoundException when user not found', async () => {
			repository.findByEmail.mockResolvedValue(null);

			await expect(
				service.findByEmail('nonexistent@example.com')
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('update user data', () => {
		it('should update and return updated user', async () => {
			const updateDto = { name: 'Jane Doe' };
			const updatedUser = { ...mockUser, ...updateDto };

			repository.findById.mockResolvedValue(mockUser);
			repository.update.mockResolvedValue(updatedUser);

			const result = await service.update(1, updateDto);

			expect(result).toEqual(updatedUser);
			expect(repository.update).toHaveBeenCalledWith(1, updateDto);
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

			const result = await service.delete(1);

			expect(result).toEqual(mockUser);
			expect(repository.delete).toHaveBeenCalledWith(1);
		});

		it('should throw NotFoundException if user does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(service.delete(2)).rejects.toThrow(NotFoundException);
			expect(repository.delete).not.toHaveBeenCalled();
		});
	});
});
