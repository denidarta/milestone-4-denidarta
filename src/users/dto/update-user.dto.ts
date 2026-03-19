import { IsOptional, IsEmail, IsString } from 'class-validator';

export class UpdateUserDto {
	@IsOptional()
	@IsEmail()
	email?: string;
	@IsOptional()
	@IsString()
	name?: string;
}
