import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { IncomingMessage, ServerResponse } from 'http';

const server = express();
let isBootstrapped = false;

async function bootstrap() {
	if (isBootstrapped) return;

	const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
		logger: ['error', 'warn', 'log'],
	});

	app.setGlobalPrefix('api/v1');
	app.use(helmet());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle('API Documentation')
		.setDescription('Belum ada deskripsi')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document);

	await app.init();
	isBootstrapped = true;
}

module.exports = async (req: IncomingMessage, res: ServerResponse) => {
	try {
		await bootstrap();
		server(req as express.Request, res as express.Response);
	} catch (err) {
		console.error('Bootstrap error:', err);
		res.statusCode = 500;
		res.end(JSON.stringify({ error: String(err) }));
	}
};
