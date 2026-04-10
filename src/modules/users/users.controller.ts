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
	Query,
	Request,
	UseGuards,
} from '@nestjs/common';
import { UserRole } from 'src/types/index.type';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
	constructor(private users: UsersService) {}

	@Post('admin')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Create a new admin user (Admin only)' })
	@ApiBody({ type: RegisterDto })
	createAdmin(@Body() dto: RegisterDto) {
		return this.users.createAdmin(dto);
	}

	@Get()
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Get all users (Admin only)' })
	findAll(
		@Query('page', new ParseIntPipe({ optional: true })) page = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit = 20
	) {
		return this.users.findAll(page, limit);
	}

	@Get('me')
	@ApiOperation({ summary: 'Get current logged in user' })
	getMe(@Request() req: { user: { userId: number } }) {
		return this.users.findById(req.user.userId);
	}

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

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: 'Delete user by id (Admin only)' })
	delete(@Param('id', ParseIntPipe) id: number) {
		return this.users.delete(id);
	}
}
