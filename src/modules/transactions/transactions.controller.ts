import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/types/UserResponse';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
	constructor(private transactions: TransactionsService) {}

	@Post('accounts/:accountId/transactions')
	create(
		@Param('accountId') accountId: string,
		@CurrentUser() user: JwtPayload,
		@Body() dto: CreateTransactionDto
	) {
		return this.transactions.create(accountId, user.userId, dto);
	}

	@Get('accounts/:accountId/transactions')
	findAll(
		@Param('accountId') accountId: string,
		@CurrentUser() user: JwtPayload,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		return this.transactions.findAll(
			accountId,
			user.userId,
			Number(page) || 1,
			Number(limit) || 20
		);
	}

	@Get('transactions/:id')
	findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
		return this.transactions.findOne(id, user.userId);
	}
}
