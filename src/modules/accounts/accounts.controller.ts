import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Request,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/types/UserResponse';

@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
	constructor(private accounts: AccountsService) {}

	@Post()
	create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAccountDto) {
		return this.accounts.create(user.userId, dto);
	}

	@Get()
	findAll(
		@CurrentUser() user: JwtPayload,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		return this.accounts.findAll(
			user.userId,
			Number(page) || 1,
			Number(limit) || 20
		);
	}

	@Get(':id')
	findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.accounts.findById(id, user.userId);
	}

	@Delete(':id')
	remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.accounts.remove(id, user.userId);
	}
}
