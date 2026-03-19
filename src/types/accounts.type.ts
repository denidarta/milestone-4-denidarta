import { AccountStatus } from '@prisma/client';

export interface AccountResponse {
	id: string;
	accountNumber: number;
	name: string;
	status: AccountStatus;
	balance: number;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}
