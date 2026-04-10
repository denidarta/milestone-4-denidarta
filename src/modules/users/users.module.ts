import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
	providers: [UsersService, UsersRepository, RolesGuard],
	controllers: [UsersController],
	exports: [UsersRepository],
})
export class UsersModule {}
