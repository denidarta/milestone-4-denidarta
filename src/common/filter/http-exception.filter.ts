import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/types/api-response.interface';

interface HttpExceptionResponse {
	message: string | string[];
	error: string;
	statusCode: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		let message: string | string[] = 'Internal server error';

		if (exception instanceof HttpException) {
			const errorResponse = exception.getResponse();
			message =
				(errorResponse as HttpExceptionResponse).message || exception.message;
		}

		const apiResponse: ApiResponse<null> = {
			status,
			message: Array.isArray(message) ? message.join(', ') : message,
			data: null,
		};

		response.status(status).json(apiResponse);
	}
}
