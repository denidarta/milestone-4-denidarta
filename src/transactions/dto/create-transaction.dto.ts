import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/client';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
	@Transform(({ value }: { value: string }) => new Decimal(value))
	@IsNotEmpty()
	amount: Decimal;

	@IsNotEmpty()
	@IsEnum(TransactionType)
	type: TransactionType;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	sourceAccountId?: string;

	@IsOptional()
	@IsString()
	destinaionAccountId?: string;
}
