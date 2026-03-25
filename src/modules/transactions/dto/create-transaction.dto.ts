import { Transform } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateIf,
} from 'class-validator';
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

	@ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
	@IsNotEmpty()
	@IsString()
	destinationAccountId?: string;
}
