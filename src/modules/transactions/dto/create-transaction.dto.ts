import { Transform } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsNumber,
	ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/client';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
	@ApiProperty({ example: '100.00', description: 'Transaction amount' })
	@Transform(({ value }: { value: string }) => new Decimal(value))
	@IsNotEmpty()
	amount: Decimal;

	@ApiProperty({ enum: TransactionType, example: TransactionType.DEPOSIT })
	@IsNotEmpty()
	@IsEnum(TransactionType)
	type: TransactionType;

	@ApiProperty({ example: 'Monthly salary', required: false })
	@IsOptional()
	description?: string;

	@ApiProperty({ example: 1, required: false })
	@IsOptional()
	@IsNumber()
	sourceAccountId?: number;

	@ApiProperty({
		example: 2,
		required: false,
		description: 'Required for TRANSFER',
	})
	@ValidateIf((o: CreateTransactionDto) => o.type === TransactionType.TRANSFER)
	@IsNotEmpty()
	@IsNumber()
	destinationAccountId?: number;
}
