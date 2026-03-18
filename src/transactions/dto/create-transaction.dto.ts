import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @Matches(/^\d+(\.\d+)?$/, {
    message: 'amount must be a positive number string',
  })
  amount: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;
}
