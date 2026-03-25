import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from 'src/types/UserResponse';

export interface RequestWithUser extends Request {
	user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): JwtPayload => {
		const request = ctx.switchToHttp().getRequest<RequestWithUser>();
		return request.user;
	}
);
