import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	Patch,
	Request,
	UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
	constructor(private users: UsersService) {}

	@UseGuards(JwtAuthGuard)
	@Get()
	findAll(@Request() req: { user: { role: UserRole } }) {
		if (req.user.role !== UserRole.ADMIN)
			throw new ForbiddenException(
				'You are not allowed to perform this action!'
			);
		return this.users.findAll();
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	getMe(@Request() req: { user: { userId: string } }) {
		return this.users.findById(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() dto: UpdateUserDto,
		@Request() req: { user: { userId: string; role: UserRole } }
	) {
		if (req.user.userId !== id && req.user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Forbidden Access');
		}
		return this.users.update(id, dto);
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	delete(
		@Param('id') id: string,
		@Request() req: { user: { role: UserRole } }
	) {
		if (req.user.role !== UserRole.ADMIN)
			throw new ForbiddenException(
				'You are not allowed to perform this action!'
			);
		return this.users.delete(id);
	}
}
