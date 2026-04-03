export const mockPrismaService = {
	$connect: jest.fn(),
	$disconnect: jest.fn(),
	$transaction: jest.fn(),
	user: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findUniqueOrThrow: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	account: {
		create: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findUniqueOrThrow: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	transaction: {
		create: jest.fn(),
		createMany: jest.fn(),
		findMany: jest.fn(),
		findUnique: jest.fn(),
		findUniqueOrThrow: jest.fn(),
		count: jest.fn(),
	},
};

export const PrismaService = jest.fn(() => mockPrismaService);
