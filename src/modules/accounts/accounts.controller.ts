import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
	Request,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/types/index.type';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
	constructor(private accounts: AccountsService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new account' })
	create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAccountDto) {
		return this.accounts.create(user.userId, dto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all accounts for current user' })
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
	@ApiOperation({ summary: 'Get account by id' })
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: JwtPayload
	) {
		return this.accounts.findById(id, user.userId);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete account by id' })
	remove(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: JwtPayload
	) {
		return this.accounts.remove(id, user.userId);
	}
}
