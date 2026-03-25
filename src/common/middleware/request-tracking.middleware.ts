import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuid4 } from 'uuid';

@Injectable()
export class RequestTracker implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const requestId = (req.headers['x-request-id'] as string) || uuid4();
		req['requestId'] = requestId;
		res.setHeader('X-Request-ID', requestId);
		next();
	}
}
