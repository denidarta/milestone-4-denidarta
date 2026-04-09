import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	const hashedPassword = await bcrypt.hash('password123', 10);

	// Seed admin user
	await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			password: hashedPassword,
			name: 'Admin',
			role: UserRole.ADMIN,
		},
	});

	console.log('Seeded: admin@example.com / password123');

	// Seed 50 regular users
	const emails = new Set<string>();
	while (emails.size < 50) {
		emails.add(faker.internet.email());
	}

	await prisma.user.createMany({
		data: Array.from(emails).map((email) => ({
			email,
			password: hashedPassword,
			name: faker.person.fullName(),
			role: UserRole.USER,
		})),
		skipDuplicates: true,
	});

	console.log('Seeded: 50 users with password "password123"');

	// Seed accounts — 1 account per user
	const users = await prisma.user.findMany({ select: { id: true } });

	const accountNumbers = new Set<number>();
	while (accountNumbers.size < users.length) {
		accountNumbers.add(faker.number.int({ min: 1000000000, max: 2100000000 }));
	}

	await prisma.account.createMany({
		data: Array.from(accountNumbers).map((accountNumber, index) => ({
			accountNumber,
			balance: faker.number.float({
				min: 100000,
				max: 50000000,
				fractionDigits: 2,
			}),
			status: AccountStatus.ACTIVE,
			userId: users[index].id,
		})),
		skipDuplicates: true,
	});

	console.log(`Seeded: ${users.length} accounts`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
