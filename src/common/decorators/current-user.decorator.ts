import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/types/UserResponse';

export interface RequestWithUser extends Request {
	user: User;
}

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): User => {
		const request = ctx.switchToHttp().getRequest<RequestWithUser>();
		return request.user;
	},
);
