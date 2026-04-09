import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/types/index.type';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
	constructor(private transactions: TransactionsService) {}

	@Post('accounts/:accountId/transactions')
	@ApiOperation({
		summary: 'Create a transaction (deposit, withdrawal, transfer)',
	})
	create(
		@Param('accountId', ParseIntPipe) accountId: number,
		@CurrentUser() user: JwtPayload,
		@Body() dto: CreateTransactionDto
	) {
		return this.transactions.create(accountId, user.userId, dto);
	}

	@Get('accounts/:accountId/transactions')
	@ApiOperation({ summary: 'Get all transactions for an account' })
	findAll(
		@Param('accountId', ParseIntPipe) accountId: number,
		@CurrentUser() user: JwtPayload,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		return this.transactions.findAll(
			accountId,
			user.userId,
			Number(page) || 1,
			Number(limit) || 20,
			user.role
		);
	}

	@Get('transactions/:id')
	@ApiOperation({ summary: 'Get transaction by id' })
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: JwtPayload
	) {
		return this.transactions.findOne(id, user.userId, user.role);
	}
}
