import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @Post('accounts/:accountId/transactions')
  create(
    @Param('accountId') accountId: string,
    @Request() req: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(accountId, req.user.userId, dto);
  }

  @Get('accounts/:accountId/transactions')
  findAll(
    @Param('accountId') accountId: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactions.findAll(accountId, req.user.userId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('transactions/:id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.transactions.findOne(id, req.user.userId);
  }
}
