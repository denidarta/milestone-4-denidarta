import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
	constructor(private users: UsersService) {}

	@Post('admin')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Create a new admin user (Admin only)' })
	@ApiBody({ type: RegisterDto })
	createAdmin(
		@Body() dto: RegisterDto,
		@Request() req: { user: { role: UserRole } }
	) {
		if (req.user.role !== UserRole.ADMIN)
			throw new ForbiddenException(
				'You are not allowed to perform this action!'
			);
		return this.users.createAdmin(dto);
	}

	@UseGuards(JwtAuthGuard)
	@Get()
	@ApiOperation({ summary: 'Get all users (Admin only)' })
	findAll(@Request() req: { user: { role: UserRole } }) {
		if (req.user.role !== UserRole.ADMIN)
			throw new ForbiddenException(
				'You are not allowed to perform this action!'
			);
		return this.users.findAll();
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	@ApiOperation({ summary: 'Get current logged in user' })
	getMe(@Request() req: { user: { userId: number } }) {
		return this.users.findById(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@Patch(':id')
	@ApiOperation({ summary: 'Update user by id' })
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateUserDto,
		@Request() req: { user: { userId: number; role: UserRole } }
	) {
		if (req.user.userId !== id && req.user.role !== UserRole.ADMIN) {
			throw new ForbiddenException('Forbidden Access');
		}
		return this.users.update(id, dto);
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	@ApiOperation({ summary: 'Delete user by id (Admin only)' })
	delete(
		@Param('id', ParseIntPipe) id: number,
		@Request() req: { user: { role: UserRole } }
	) {
		if (req.user.role !== UserRole.ADMIN)
			throw new ForbiddenException(
				'You are not allowed to perform this action!'
			);
		return this.users.delete(id);
	}
}
