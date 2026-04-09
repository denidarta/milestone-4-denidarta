import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
	Patch,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/types/index.type';
import { UserRole } from 'src/types/index.type';

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
	@ApiOperation({
		summary: 'Get all accounts (Admin: all users, User: own accounts)',
	})
	findAll(
		@CurrentUser() user: JwtPayload,
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('userId') userId?: string
	) {
		const p = Number(page) || 1;
		const l = Number(limit) || 20;

		if (user.role === UserRole.ADMIN) {
			if (userId) {
				return this.accounts.findAllByUser(Number(userId), p, l);
			}
			return this.accounts.findAll(p, l);
		}
		return this.accounts.findAllByUser(user.userId, p, l);
	}

	@Get('lookup/:accountNumber')
	@ApiOperation({
		summary:
			'Lookup account by account number — returns account number and owner name',
	})
	findByNumber(@Param('accountNumber', ParseIntPipe) accountNumber: number) {
		return this.accounts.findByAccountNumber(accountNumber);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get accounts by id' })
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: JwtPayload
	) {
		return this.accounts.findById(id, user.userId, user.role);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update account status by id' })
	update(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: JwtPayload,
		@Body() dto: UpdateAccountDto
	) {
		return this.accounts.update(id, user.userId, user.role, dto);
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
