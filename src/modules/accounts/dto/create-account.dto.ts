import { IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
	@IsString()
	name: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	accountNumber: number;
}
