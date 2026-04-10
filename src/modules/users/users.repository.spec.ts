import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/__mocks__/prisma.service';
import { UserRole } from '@prisma/client';
import { userSelect } from './users.repository';

const mockUser = {
	id: 1,
	name: 'John Doe',
	email: 'john@mail.com',
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockUserWithCredentials = {
	...mockUser,
	password: 'hashed_password',
	role: UserRole.USER,
};

describe('UsersRepository', () => {
	let repository: UsersRepository;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersRepository,
				{ provide: PrismaService, useValue: mockPrismaService },
			],
		}).compile();

		repository = module.get<UsersRepository>(UsersRepository);
	});

	afterEach(() => jest.clearAllMocks());

	describe('create', () => {
		it('should call prisma.user.create with correct data', async () => {
			mockPrismaService.user.create.mockResolvedValue(mockUserWithCredentials);

			const dto = {
				email: 'john@mail.com',
				password: 'hashed_password',
				name: 'John Doe',
				role: UserRole.USER,
			};

			const result = await repository.create(dto);

			expect(result).toEqual(mockUserWithCredentials);
			expect(mockPrismaService.user.create).toHaveBeenCalledWith({ data: dto });
		});
	});

	describe('findAll', () => {
		it('should return all users', async () => {
			mockPrismaService.user.findMany.mockResolvedValue([mockUser]);

			const result = await repository.findAll(0, 20);

			expect(result).toEqual([mockUser]);
			expect(mockPrismaService.user.findMany).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return user when found', async () => {
			mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

			const result = await repository.findById(1);

			expect(result).toEqual(mockUser);
			expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
				where: { id: 1 },
				select: userSelect,
			});
		});

		it('should throw when user not found', async () => {
			mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(
				new Error('Not found')
			);

			await expect(repository.findById(99)).rejects.toThrow('Not found');
		});
	});

	describe('findByEmail', () => {
		it('should return user when found', async () => {
			mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

			const result = await repository.findByEmail('john@mail.com');

			expect(result).toEqual(mockUser);
			expect(mockPrismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
				where: { email: 'john@mail.com' },
				select: userSelect,
			});
		});

		it('should throw when email not found', async () => {
			mockPrismaService.user.findUniqueOrThrow.mockRejectedValue(
				new Error('Not found')
			);

			await expect(repository.findByEmail('ghost@mail.com')).rejects.toThrow(
				'Not found'
			);
		});
	});

	describe('update', () => {
		it('should call prisma.user.update with correct args', async () => {
			const updated = { ...mockUser, name: 'Jane Doe' };
			mockPrismaService.user.update.mockResolvedValue(updated);

			const result = await repository.update(1, { name: 'Jane Doe' });

			expect(result).toEqual(updated);
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: 1 },
				data: { name: 'Jane Doe' },
				select: userSelect,
			});
		});
	});

	describe('delete', () => {
		it('should call prisma.user.delete with correct id', async () => {
			mockPrismaService.user.delete.mockResolvedValue(mockUser);

			const result = await repository.delete(1);

			expect(result).toEqual(mockUser);
			expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
				where: { id: 1 },
				select: userSelect,
			});
		});
	});
});
