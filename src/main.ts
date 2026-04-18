import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

async function bootstrap() {
	const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

	app.setGlobalPrefix('api/v1');
	app.use(helmet());
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
		})
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
}

const bootstrapPromise = bootstrap();

export default async (req: express.Request, res: express.Response) => {
	await bootstrapPromise;
	server(req, res);
};
