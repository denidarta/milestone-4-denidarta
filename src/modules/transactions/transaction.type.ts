import { TransactionType } from '@prisma/client';

export interface TransactionResponse {
	id: string;
	amount: number;
	type: TransactionType;
	description?: string;
	accountId: string;
	createdAt: Date;
}
