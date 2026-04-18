import { Test, TestingModule } from '@nestjs/testing';
import {
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserRole } from 'src/types/index.type';

const mockUser = {
	id: 1,
	name: 'John Doe',
	email: 'john@example.com',
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockUsersRepository = {
	create: jest.fn(),
	findAll: jest.fn(),
	count: jest.fn(),
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

	describe('createAdmin', () => {
		const dto = {
			name: 'John Doe',
			email: 'john@example.com',
			password: 'Pass@123',
		};

		it('should create an admin user and return user without password', async () => {
			repository.findByEmail.mockResolvedValue(null);
			repository.create.mockResolvedValue({
				...mockUser,
				password: 'hashed',
				role: 'ADMIN',
			});

			const result = await service.createAdmin(dto);

			expect(result).not.toHaveProperty('password');
			expect(repository.create).toHaveBeenCalled();
		});

		it('should throw ConflictException when email already in use', async () => {
			repository.findByEmail.mockResolvedValue(mockUser);

			await expect(service.createAdmin(dto)).rejects.toThrow(ConflictException);
			expect(repository.create).not.toHaveBeenCalled();
		});
	});

	describe('findAll users (paginated)', () => {
		it('should return paginated users on page 1', async () => {
			const users = [
				mockUser,
				{ ...mockUser, id: 2, email: 'jane@example.com' },
			];
			repository.findAll.mockResolvedValue(users);
			repository.count.mockResolvedValue(50);

			const result = await service.findAll(1, 20);

			expect(result).toEqual({ data: users, total: 50, page: 1, limit: 20 });
			expect(repository.findAll).toHaveBeenCalledWith(0, 20, undefined);
			expect(repository.count).toHaveBeenCalledWith(undefined);
		});

		it('should apply correct skip offset for page 2', async () => {
			repository.findAll.mockResolvedValue([]);
			repository.count.mockResolvedValue(50);

			await service.findAll(2, 10);

			expect(repository.findAll).toHaveBeenCalledWith(10, 10, undefined);
		});

		it('should pass search term to repository', async () => {
			repository.findAll.mockResolvedValue([mockUser]);
			repository.count.mockResolvedValue(1);

			const result = await service.findAll(1, 20, 'john');

			expect(result.data).toEqual([mockUser]);
			expect(repository.findAll).toHaveBeenCalledWith(0, 20, 'john');
			expect(repository.count).toHaveBeenCalledWith('john');
		});
	});

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
		it('should update and return updated user when requester is owner', async () => {
			const updateDto = { name: 'Jane Doe' };
			const updatedUser = { ...mockUser, ...updateDto };

			repository.findById.mockResolvedValue(mockUser);
			repository.update.mockResolvedValue(updatedUser);

			const result = await service.update(1, updateDto, 1, UserRole.USER);

			expect(result).toEqual(updatedUser);
			expect(repository.update).toHaveBeenCalledWith(1, updateDto);
		});

		it('should update when requester is admin', async () => {
			const updateDto = { name: 'Jane Doe' };
			const updatedUser = { ...mockUser, ...updateDto };

			repository.findById.mockResolvedValue(mockUser);
			repository.update.mockResolvedValue(updatedUser);

			const result = await service.update(1, updateDto, 99, UserRole.ADMIN);

			expect(result).toEqual(updatedUser);
		});

		it('should throw ForbiddenException when requester is not owner or admin', async () => {
			await expect(
				service.update(1, { name: 'X' }, 99, UserRole.USER)
			).rejects.toThrow(ForbiddenException);
			expect(repository.update).not.toHaveBeenCalled();
		});

		it('should throw NotFoundException if user does not exist', async () => {
			repository.findById.mockResolvedValue(null);

			await expect(
				service.update(88, { name: 'X' }, 88, UserRole.USER)
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
