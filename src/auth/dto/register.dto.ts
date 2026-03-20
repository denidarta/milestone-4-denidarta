import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	Matches,
	IsOptional,
} from 'class-validator';

export class RegisterDto {
	@IsNotEmpty()
	@IsEmail()
	email: string;

	@IsNotEmpty()
	@IsString()
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
		{
			message:
				'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
		}
	)
	password: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	name?: string;
}
