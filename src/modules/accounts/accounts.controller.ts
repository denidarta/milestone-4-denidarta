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
import { UpdateAccountDto } from './dto/update-account.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
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
	@ApiOperation({ summary: 'Create a new bank account' })
	create(@CurrentUser() user: JwtPayload) {
		return this.accounts.create(user.userId);
	}

	@Get()
	@ApiOperation({
		summary: 'Get all accounts (Admin: all users, User: own accounts)',
	})
	findAll(
		@CurrentUser() user: JwtPayload,
		@Query() { page, limit }: PaginationDto,
		@Query('userId') userId?: string
	) {
		if (user.role === UserRole.ADMIN) {
			if (userId) {
				return this.accounts.findAllByUser(Number(userId), page, limit);
			}
			return this.accounts.findAll(page, limit);
		}
		return this.accounts.findAllByUser(user.userId, page, limit);
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
		return this.accounts.remove(id, user.userId, user.role);
	}
}
