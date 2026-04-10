import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/types/index.type';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from 'src/types/index.type';
import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request & { user: JwtPayload }>();
		const user = request.user;

		if (!requiredRoles.includes(user.role)) {
			throw new ForbiddenException('You are not allowed to perform this action!');
		}

		return true;
	}
}
